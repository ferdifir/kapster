import { createClient } from "@supabase/supabase-js";

function createAgentDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export interface Task {
  id: string;
  agent_id: string;
  parent_task_id: string | null;
  sub_agent_id: string | null;
  title: string;
  description: string | null;
  status: "pending" | "in_progress" | "completed" | "failed" | "checkpoint" | "blocked";
  score: number | null;
  auto_executed: boolean;
  escalation: { reason: string; what_i_need: string; requested_at: string } | null;
  checkpoint_data: Record<string, unknown> | null;
  token_usage: number | null;
  created_at: string;
  updated_at: string;
}

export interface TaskInput {
  agent_id: string;
  parent_task_id?: string;
  sub_agent_id?: string;
  title: string;
  description?: string;
}

export interface LogInput {
  agent_id: string;
  task_id?: string;
  action: string;
  details?: Record<string, unknown>;
}

export class Agent {
  public agentId: string;
  protected db;

  constructor(agentId: string) {
    this.agentId = agentId;
    this.db = createAgentDb();
  }

  async createTask(input: TaskInput): Promise<Task> {
    const { data, error } = await this.db
      .from("agent_tasks")
      .insert({
        agent_id: input.agent_id,
        parent_task_id: input.parent_task_id ?? null,
        sub_agent_id: input.sub_agent_id ?? null,
        title: input.title,
        description: input.description ?? null,
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create task: ${error.message}`);
    return data as Task;
  }

  async getTask(id: string): Promise<Task | null> {
    const { data } = await this.db
      .from("agent_tasks")
      .select()
      .eq("id", id)
      .single();

    return data as Task | null;
  }

  async listTasks(agentId?: string, status?: string): Promise<Task[]> {
    let query = this.db.from("agent_tasks").select().order("created_at", { ascending: false });

    if (agentId) query = query.eq("agent_id", agentId);
    if (status) query = query.eq("status", status);

    const { data } = await query;
    return (data ?? []) as Task[];
  }

  async updateTask(id: string, updates: Partial<Task>): Promise<void> {
    const { error } = await this.db
      .from("agent_tasks")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) throw new Error(`Failed to update task: ${error.message}`);
  }

  async log(input: LogInput): Promise<void> {
    const { error } = await this.db
      .from("agent_logs")
      .insert({
        agent_id: input.agent_id,
        task_id: input.task_id ?? null,
        action: input.action,
        details: input.details ?? {},
      });

    if (error) throw new Error(`Failed to write log: ${error.message}`);
  }

  async getLogs(agentId?: string, limit = 50): Promise<unknown[]> {
    let query = this.db
      .from("agent_logs")
      .select()
      .order("created_at", { ascending: false })
      .limit(limit);

    if (agentId) query = query.eq("agent_id", agentId);

    const { data } = await query;
    return data ?? [];
  }

  async setMemory(key: string, value: unknown, expiresInSec?: number): Promise<void> {
    const expires_at = expiresInSec
      ? new Date(Date.now() + expiresInSec * 1000).toISOString()
      : null;

    const { error } = await this.db
      .from("agent_memory")
      .upsert(
        {
          agent_id: this.agentId,
          key,
          value,
          expires_at,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "agent_id, key" }
      );

    if (error) throw new Error(`Failed to set memory: ${error.message}`);
  }

  async getMemory(key: string): Promise<unknown | null> {
    const { data } = await this.db
      .from("agent_memory")
      .select("value")
      .eq("agent_id", this.agentId)
      .eq("key", key)
      .maybeSingle();

    return data?.value ?? null;
  }
}

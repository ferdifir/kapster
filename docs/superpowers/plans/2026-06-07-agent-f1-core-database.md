# Fase 1: Database + Agent Core — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Create foundation for agent system — Supabase tables, TypeScript types, base Agent class, task CRUD API.

**Architecture:** Single plan file adding 3 tables to Supabase, a base class in `lib/agents/core/`, and API routes under `app/api/agents/`. All agents extend `Agent` base class which wraps Supabase admin client for DB access.

**Tech Stack:** Supabase (PostgreSQL), Next.js App Router, TypeScript

---

### Task 1: Create SQL Migration

**Files:**
- Create: `supabase/migrations/agent_system.sql`

- [ ] **Step 1: Write migration**

```sql
-- Agent system tables

create table agent_tasks (
  id uuid primary key default gen_random_uuid(),
  agent_id text not null,
  parent_task_id uuid references agent_tasks(id),
  sub_agent_id text,
  title text not null,
  description text,
  status text not null default 'pending',
  score integer,
  auto_executed boolean default false,
  escalation jsonb,
  checkpoint_data jsonb,
  token_usage integer,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

create table agent_logs (
  id uuid primary key default gen_random_uuid(),
  agent_id text not null,
  task_id uuid references agent_tasks(id),
  action text not null,
  details jsonb,
  created_at timestamp default now()
);

create table agent_memory (
  id uuid primary key default gen_random_uuid(),
  agent_id text not null,
  key text not null,
  value jsonb not null,
  expires_at timestamp,
  created_at timestamp default now(),
  updated_at timestamp default now(),
  unique(agent_id, key)
);
```

- [ ] **Step 2: Run migration**

Run: `psql "$SUPABASE_DB_URL" -f supabase/migrations/agent_system.sql`

Expected: `CREATE TABLE` x3

Or run via Supabase CLI if available:
```bash
 supabase db push
```

---

### Task 2: Create TypeScript Types + Agent Base Class

**Files:**
- Create: `lib/agents/core/agent.ts`
- Create: `lib/agents/index.ts`

- [ ] **Step 1: Write Agent base class**

```typescript
import { createAdminClient } from "@/lib/supabase/admin";

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

export interface MemoryEntry {
  id: string;
  agent_id: string;
  key: string;
  value: unknown;
  expires_at: string | null;
}

export class Agent {
  public agentId: string;
  protected db;

  constructor(agentId: string) {
    this.agentId = agentId;
    this.db = createAdminClient();
  }

  // Task operations
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

  // Log operations
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

  // Memory operations
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
          value: value as never,
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
```

- [ ] **Step 2: Write barrel export**

```typescript
export { Agent } from "./core/agent";
export type { Task, TaskInput, LogInput, MemoryEntry } from "./core/agent";
```

---

### Task 3: Create Task CRUD API Routes

**Files:**
- Create: `app/api/agents/tasks/route.ts`
- Create: `app/api/agents/tasks/[id]/route.ts`

- [ ] **Step 1: Write list + create route**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { Agent } from "@/lib/agents";
import { logError } from "@/lib/error-logger";

const agent = new Agent("api");

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get("agent_id") ?? undefined;
    const status = searchParams.get("status") ?? undefined;

    const tasks = await agent.listTasks(agentId, status);
    return NextResponse.json(tasks);
  } catch (error) {
    logError("agents/tasks/GET", error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.agent_id || !body.title) {
      return NextResponse.json({ error: "agent_id and title are required" }, { status: 400 });
    }

    const task = await agent.createTask({
      agent_id: body.agent_id,
      parent_task_id: body.parent_task_id,
      sub_agent_id: body.sub_agent_id,
      title: body.title,
      description: body.description,
    });

    await agent.log({
      agent_id: body.agent_id,
      task_id: task.id,
      action: "task_created",
      details: { title: body.title },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    logError("agents/tasks/POST", error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Write task detail + update route**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { Agent } from "@/lib/agents";
import { logError } from "@/lib/error-logger";

const agent = new Agent("api");

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const task = await agent.getTask(id);

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json(task);
  } catch (error) {
    logError("agents/tasks/[id]/GET", error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const existing = await agent.getTask(id);

    if (!existing) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    await agent.updateTask(id, body);

    await agent.log({
      agent_id: existing.agent_id,
      task_id: id,
      action: "task_updated",
      details: { changes: body },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logError("agents/tasks/[id]/PATCH", error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

---

### Task 4: Create Memory API Route

**Files:**
- Create: `app/api/agents/memory/route.ts`

- [ ] **Step 1: Write memory route**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { Agent } from "@/lib/agents";
import { logError } from "@/lib/error-logger";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get("agent_id");
    const key = searchParams.get("key");

    if (!agentId || !key) {
      return NextResponse.json({ error: "agent_id and key are required" }, { status: 400 });
    }

    const agent = new Agent(agentId);
    const value = await agent.getMemory(key);

    return NextResponse.json({ key, value });
  } catch (error) {
    logError("agents/memory/GET", error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.agent_id || !body.key) {
      return NextResponse.json({ error: "agent_id and key are required" }, { status: 400 });
    }

    const agent = new Agent(body.agent_id);
    await agent.setMemory(body.key, body.value, body.expires_in_sec);

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    logError("agents/memory/POST", error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

---

### Task 5: Verify

- [ ] **Step 1: Build check**

Run: `pnpm run build` (or `npm run build`)
Expected: No TypeScript errors

- [ ] **Step 2: Test task creation**

```bash
curl -X POST http://localhost:3000/api/agents/tasks \
  -H "Content-Type: application/json" \
  -d '{"agent_id":"coo","title":"test task","description":"testing api"}'
```
Expected: Response 201 with task object containing id, agent_id, title

- [ ] **Step 3: Test task list**

```bash
curl http://localhost:3000/api/agents/tasks
```
Expected: Array with at least 1 task

- [ ] **Step 4: Test task detail**

```bash
curl http://localhost:3000/api/agents/tasks/<id-from-step-2>
```
Expected: Single task object

- [ ] **Step 5: Test task update**

```bash
curl -X PATCH http://localhost:3000/api/agents/tasks/<id> \
  -H "Content-Type: application/json" \
  -d '{"status":"in_progress"}'
```
Expected: `{"success":true}`

- [ ] **Step 6: Test memory**

```bash
curl -X POST http://localhost:3000/api/agents/memory \
  -H "Content-Type: application/json" \
  -d '{"agent_id":"coo","key":"test_key","value":"hello world"}'
```
Expected: 201

```bash
curl "http://localhost:3000/api/agents/memory?agent_id=coo&key=test_key"
```
Expected: `{"key":"test_key","value":"hello world"}`

- [ ] **Step 7: Commit**

```bash
git add supabase/migrations/agent_system.sql lib/agents/ app/api/agents/
git commit -m "feat(agents): add database schema, base agent class, and task CRUD API"
```

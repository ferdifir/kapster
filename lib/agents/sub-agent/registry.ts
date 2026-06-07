import { Agent } from "../core/agent";

export interface SubAgentConfig {
  name: string;
  parentAgentId: string;
  type: "task" | "role";
  description: string;
  tokenBudget: number;
  allowedTools: string[];
}

export interface SubAgentRecord {
  id: string;
  config: SubAgentConfig;
  status: "active" | "suspended" | "destroyed";
  createdAt: string;
}

const REGISTRY_KEY = "sub_agent_registry";

export async function register(config: SubAgentConfig): Promise<string> {
  const agent = new Agent("coo");
  const existing = (await agent.getMemory(REGISTRY_KEY)) as SubAgentRecord[] ?? [];

  const id = `sub-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const record: SubAgentRecord = {
    id,
    config,
    status: "active",
    createdAt: new Date().toISOString(),
  };

  existing.push(record);
  await agent.setMemory(REGISTRY_KEY, existing);

  await agent.log({
    agent_id: config.parentAgentId,
    action: "sub_agent_created",
    details: { subAgentId: id, name: config.name, type: config.type },
  });

  return id;
}

export async function list(parentAgentId?: string): Promise<SubAgentRecord[]> {
  const agent = new Agent("coo");
  const all = (await agent.getMemory(REGISTRY_KEY)) as SubAgentRecord[] ?? [];

  if (parentAgentId) {
    return all.filter((s) => s.config.parentAgentId === parentAgentId && s.status !== "destroyed");
  }

  return all.filter((s) => s.status !== "destroyed");
}

export async function getById(id: string): Promise<SubAgentRecord | null> {
  const coo = new Agent("coo");
  const all = (await coo.getMemory(REGISTRY_KEY)) as SubAgentRecord[] ?? [];
  return all.find((s) => s.id === id) ?? null;
}

export async function suspend(id: string): Promise<void> {
  const agent = new Agent("coo");
  const all = (await agent.getMemory(REGISTRY_KEY)) as SubAgentRecord[] ?? [];
  const idx = all.findIndex((s) => s.id === id);
  if (idx === -1) throw new Error("Sub-agent not found");

  all[idx].status = "suspended";
  await agent.setMemory(REGISTRY_KEY, all);
}

export async function destroy(id: string): Promise<void> {
  const agent = new Agent("coo");
  const all = (await agent.getMemory(REGISTRY_KEY)) as SubAgentRecord[] ?? [];
  const idx = all.findIndex((s) => s.id === id);
  if (idx === -1) throw new Error("Sub-agent not found");

  all[idx].status = "destroyed";
  await agent.setMemory(REGISTRY_KEY, all);

  await agent.log({
    agent_id: all[idx].config.parentAgentId,
    action: "sub_agent_destroyed",
    details: { subAgentId: id, name: all[idx].config.name },
  });
}

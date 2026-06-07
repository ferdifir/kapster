import { Agent } from "../core/agent";

const DEFAULT_BUDGET = 100_000; // tokens per day per agent

function todayKey(): string {
  const d = new Date();
  return `token_budget:${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export async function getTokenUsage(agentId: string): Promise<number> {
  const agent = new Agent(agentId);
  const val = await agent.getMemory(todayKey());
  return (val as number) ?? 0;
}

export async function trackTokenUsage(agentId: string, tokens: number): Promise<void> {
  const agent = new Agent(agentId);
  const used = await getTokenUsage(agentId);
  await agent.setMemory(todayKey(), used + tokens);
}

export async function getTokenRemaining(agentId: string): Promise<number> {
  const used = await getTokenUsage(agentId);
  return Math.max(0, DEFAULT_BUDGET - used);
}

export async function resetTokenBudget(): Promise<void> {
  const agents = ["coo", "hacker", "hipster", "hustler"];
  const key = todayKey();
  for (const id of agents) {
    const agent = new Agent(id);
    await agent.setMemory(key, 0);
  }
}

export async function checkLowToken(): Promise<string[]> {
  const agents = ["coo", "hacker", "hipster", "hustler"];
  const low: string[] = [];

  for (const id of agents) {
    const remaining = await getTokenRemaining(id);
    if (remaining < DEFAULT_BUDGET * 0.2) {
      low.push(id);
    }
  }

  return low;
}

export function getDefaultBudget(): number {
  return DEFAULT_BUDGET;
}

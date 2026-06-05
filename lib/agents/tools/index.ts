import type { ToolDefinition } from "../types";
import { createSharedTools } from "./shared-tools";
import { createHackerTools } from "./hacker-tools";
import { createHipsterTools } from "./hipster-tools";
import { createHustlerTools } from "./hustler-tools";
import type { AgentRole } from "../types";

const shared = createSharedTools();

const roleTools: Record<AgentRole, Map<string, ToolDefinition>> = {
  hacker: createHackerTools(),
  hipster: createHipsterTools(),
  hustler: createHustlerTools(),
};

export function getToolsForRole(role: AgentRole): Map<string, ToolDefinition> {
  const tools = new Map(shared);
  for (const [name, tool] of roleTools[role]) {
    tools.set(name, tool);
  }
  return tools;
}

export async function registerTool(role: AgentRole, tool: ToolDefinition): Promise<void> {
  roleTools[role].set(tool.name, tool);
  try {
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const supabase = createAdminClient();
    const agentTools = supabase as unknown as { from: (t: string) => { upsert: (v: Record<string, unknown>) => Promise<unknown> } };
    await agentTools.from("agent_custom_tools").upsert({
      role,
      tool_name: tool.name,
      tool_definition: { name: tool.name, description: tool.description, parameters: tool.parameters },
    } as Record<string, unknown>);
  } catch {
    // Best effort persist
  }
}

export async function loadCustomTools(): Promise<void> {
  try {
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const supabase = createAdminClient();
    const agentTools = supabase as unknown as { from: (t: string) => { select: (columns?: string) => Promise<{ data: Record<string, unknown>[] | null }> } };
    const { data } = await agentTools.from("agent_custom_tools").select("*");
    if (data) {
      for (const row of data) {
        const r = row as { role: AgentRole; tool_definition: string | Record<string, unknown> };
        const def = typeof r.tool_definition === "string"
          ? JSON.parse(r.tool_definition) as ToolDefinition
          : r.tool_definition as unknown as ToolDefinition;
        if (def) {
          roleTools[r.role].set(def.name, def);
        }
      }
    }
  } catch {
    // Best effort load
  }
}

export { createSharedTools };

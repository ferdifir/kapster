import { askAgent } from "./llm";
import type { AgentRole, AgentEvent, ToolDefinition, ToolResult, AgentDecision } from "./types";

type LLMMessage = { role: "system" | "user" | "assistant" | "tool"; content: string; tool_call_id?: string };

export abstract class BaseAgent {
  abstract role: AgentRole;
  abstract systemPrompt: string;

  constructor(protected tools: Map<string, ToolDefinition>) {}

  async processEvent(event: AgentEvent): Promise<AgentDecision> {
    const messages: LLMMessage[] = [
      { role: "system", content: this.systemPrompt },
      { role: "user", content: JSON.stringify({ event_type: event.event_type, payload: event.payload }) },
    ];

    const toolDefs = Array.from(this.tools.values()).map((t) => ({
      type: "function" as const,
      function: { name: t.name, description: t.description, parameters: t.parameters },
    }));

    const response = await askAgent(this.role, messages, toolDefs.length > 0 ? toolDefs : undefined);

    let decision: AgentDecision;
    try {
      decision = JSON.parse(response) as AgentDecision;
    } catch {
      decision = { reasoning: response, action: "report", report_message: response };
    }

    const results: ToolResult[] = [];
    if (decision.tool_calls) {
      for (const call of decision.tool_calls) {
        const tool = this.tools.get(call.name);
        if (!tool) {
          results.push({ success: false, error: `Tool ${call.name} not found` });
          continue;
        }
        let lastError: string | undefined;
        for (let attempt = 1; attempt <= 3; attempt++) {
          try {
            const result = await tool.handler({ ...call.params, _agent_role: this.role });
            results.push(result);
            messages.push({ role: "assistant", content: JSON.stringify({ tool: call.name, result }) });
            lastError = undefined;
            break;
          } catch (err) {
            lastError = String(err);
            if (attempt < 3) {
              await new Promise((r) => setTimeout(r, 1000 * attempt));
            }
          }
        }
        if (lastError) {
          results.push({ success: false, error: lastError });
        }
      }
    }

    return {
      ...decision,
      tool_calls: decision.tool_calls?.map((c, i) => ({ ...c, result: results[i] })),
    };
  }
}

const agents = new Map<AgentRole, BaseAgent>();

export function registerAgent(role: AgentRole, agent: BaseAgent): void {
  agents.set(role, agent);
}

export function getAgent(role: AgentRole): BaseAgent {
  const agent = agents.get(role);
  if (!agent) throw new Error(`Agent ${role} not registered. Agents will be registered in Task 5.`);
  return agent;
}

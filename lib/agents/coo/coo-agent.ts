import { Agent, type Task } from "../core/agent";
import { askLlm } from "../llm/groq";
import { calculateScore, evaluateThreshold } from "./scoring";
import { runStandup, prioritizeTasks } from "./standup";
import fs from "fs";
import path from "path";

const PERSONA_PATH = path.join(process.cwd(), "agents", "coo-context.md");

function loadPersona(): string {
  try {
    return fs.readFileSync(PERSONA_PATH, "utf-8");
  } catch {
    return "You are COO, chief operating officer of Kapster startup.";
  }
}

export class CooAgent extends Agent {
  constructor() {
    super("coo");
  }

  async standup(): Promise<string> {
    await this.log({
      agent_id: "coo",
      action: "daily_cycle_started",
      details: { time: new Date().toISOString() },
    });

    await prioritizeTasks();
    const summary = await runStandup();
    return summary;
  }

  async getStatus(): Promise<{
    today: unknown[];
    pendingTasks: Task[];
    inProgressTasks: Task[];
  }> {
    const today = await this.getLogs("coo", 20);
    const pendingTasks = await this.listTasks("", "pending");
    const inProgressTasks = await this.listTasks("", "in_progress");

    return {
      today,
      pendingTasks,
      inProgressTasks,
    };
  }

  async getReport(): Promise<string> {
    const logs = await this.getLogs("coo", 50);
    const persona = loadPersona();

    const logsSummary = (logs as Array<{ action: string; details: unknown; created_at: string }>)
      .map((l) => `- ${l.action}: ${JSON.stringify(l.details)} (${l.created_at})`)
      .join("\n");

    const prompt = `Summarize today's COO activity into a concise daily report:

${logsSummary}`;

    return await askLlm([
      { role: "system", content: persona },
      { role: "user", content: prompt },
    ], { temperature: 0.3, maxTokens: 500 });
  }

  async handleEscalation(
    taskId: string,
    response: { type: "data" | "decision" | "access" | "instruction"; content: string }
  ): Promise<void> {
    const task = await this.getTask(taskId);
    if (!task) throw new Error("Task not found");

    await this.updateTask(taskId, {
      status: "in_progress",
      escalation: null,
    } as Partial<Task>);

    await this.log({
      agent_id: "coo",
      task_id: taskId,
      action: "escalation_resolved",
      details: { responseType: response.type, content: response.content },
    });
  }

  async ask(query: string): Promise<string> {
    const persona = loadPersona();
    const status = await this.getStatus();

    const context = `Today's activity: ${JSON.stringify(status.today)}
Pending tasks: ${status.pendingTasks.length}
In progress: ${status.inProgressTasks.length}`;

    const prompt = `Context:
${context}

Founder asks: ${query}

Answer concisely as COO.`;

    return await askLlm([
      { role: "system", content: persona },
      { role: "user", content: prompt },
    ], { temperature: 0.3, maxTokens: 500 });
  }
}

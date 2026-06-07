import { Agent, type Task } from "../core/agent";
import { askLlm } from "../llm/groq";
import * as analytics from "./business-analytics";
import fs from "fs";
import path from "path";

const PERSONA_PATH = path.join(process.cwd(), "agents", "hustler-context.md");

function loadPersona(): string {
  try {
    return fs.readFileSync(PERSONA_PATH, "utf-8");
  } catch {
    return "You are the growth co-founder of Kapster.";
  }
}

export class HustlerAgent extends Agent {
  constructor() {
    super("hustler");
  }

  async execute(taskId: string): Promise<string> {
    const task = await this.getTask(taskId);
    if (!task) throw new Error("Task not found");

    await this.updateTask(taskId, { status: "in_progress" } as Partial<Task>);
    await this.log({
      agent_id: "hustler",
      task_id: taskId,
      action: "task_started",
      details: { title: task.title },
    });

    try {
      const persona = loadPersona();
      const revenue = await analytics.getRevenue(30);
      const subscribers = await analytics.getActiveSubscribers();

      const context = `Revenue (30 days): Rp ${revenue.total.toLocaleString("id-ID")}
Active subscribers: ${subscribers}

Task: ${task.title}
Description: ${task.description ?? "none"}

Return JSON:
{
  "analysis": "key findings",
  "recommendation": "what to do",
  "action": "report" | "needs_help",
  "summary": "brief conclusion"
}`;

      const response = await askLlm(
        [
          { role: "system", content: persona },
          { role: "user", content: context },
        ],
        { temperature: 0.3, maxTokens: 1000, responseFormat: "json" }
      );

      const result = JSON.parse(response);

      await this.updateTask(taskId, { status: "completed" } as Partial<Task>);
      await this.log({
        agent_id: "hustler",
        task_id: taskId,
        action: "task_completed",
        details: { summary: result.summary, analysis: result.analysis },
      });

      return `DONE: ${result.summary}`;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      await this.updateTask(taskId, { status: "failed" } as Partial<Task>);
      await this.log({
        agent_id: "hustler",
        task_id: taskId,
        action: "task_failed",
        details: { error: msg },
      });
      return `FAILED: ${msg}`;
    }
  }
}

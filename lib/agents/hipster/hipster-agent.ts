import { Agent, type Task } from "../core/agent";
import { askLlm } from "../llm/groq";
import * as frontend from "./frontend-fs";
import fs from "fs";
import path from "path";

const PERSONA_PATH = path.join(process.cwd(), "agents", "hipster-context.md");

function loadPersona(): string {
  try {
    return fs.readFileSync(PERSONA_PATH, "utf-8");
  } catch {
    return "You are a product designer maintaining Kapster's frontend.";
  }
}

export class HipsterAgent extends Agent {
  constructor() {
    super("hipster");
  }

  async execute(taskId: string): Promise<string> {
    const task = await this.getTask(taskId);
    if (!task) throw new Error("Task not found");

    await this.updateTask(taskId, { status: "in_progress" } as Partial<Task>);
    await this.log({
      agent_id: "hipster",
      task_id: taskId,
      action: "task_started",
      details: { title: task.title },
    });

    try {
      const persona = loadPersona();

      const prompt = `Task: ${task.title}
Description: ${task.description ?? "none"}

You can:
1. Read/edit frontend files in app/, components/, public/
2. Query user analytics (read-only)
3. Manage brand assets

Return JSON:
{
  "action": "edit" | "query" | "needs_help",
  "files": ["path/to/file.tsx"],
  "changes": { "file.tsx": "new content" },
  "summary": "what was done"
}`;

      const response = await askLlm(
        [
          { role: "system", content: persona },
          { role: "user", content: prompt },
        ],
        { temperature: 0.3, maxTokens: 1000, responseFormat: "json" }
      );

      const result = JSON.parse(response);

      if (result.action === "needs_help") {
        await this.updateTask(taskId, {
          status: "blocked",
          escalation: {
            reason: "Hipster needs input",
            what_i_need: result.summary,
            requested_at: new Date().toISOString(),
          },
        } as Partial<Task>);
        return `BLOCKED: ${result.summary}`;
      }

      // Apply file changes
      if (result.changes) {
        for (const [filePath, content] of Object.entries(result.changes)) {
          await frontend.writeComponent(filePath, content as string);
        }
      }

      await this.updateTask(taskId, { status: "completed" } as Partial<Task>);
      await this.log({
        agent_id: "hipster",
        task_id: taskId,
        action: "task_completed",
        details: { summary: result.summary, files: result.files },
      });

      return `DONE: ${result.summary}`;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      await this.updateTask(taskId, { status: "failed" } as Partial<Task>);
      await this.log({
        agent_id: "hipster",
        task_id: taskId,
        action: "task_failed",
        details: { error: msg },
      });
      return `FAILED: ${msg}`;
    }
  }
}

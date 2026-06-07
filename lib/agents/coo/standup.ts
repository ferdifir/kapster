import { Agent, type Task } from "../core/agent";
import { askLlm } from "../llm/groq";
import { calculateScore, evaluateThreshold } from "./scoring";
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

export async function runStandup(): Promise<string> {
  const agent = new Agent("coo");
  const pending = await agent.listTasks("", "pending");
  const inProgress = await agent.listTasks("", "in_progress");
  const persona = loadPersona();

  const tasksSummary = pending.length > 0
    ? pending.map((t: Task) => `- [${t.agent_id}] ${t.title} (score: ${t.score ?? "unscored"})`).join("\n")
    : "No pending tasks.";

  const inProgressSummary = inProgress.length > 0
    ? inProgress.map((t: Task) => `- [${t.agent_id}] ${t.title}`).join("\n")
    : "None in progress.";

  const prompt = `Today is ${new Date().toLocaleDateString("id-ID")}.

Pending tasks:
${tasksSummary}

In progress:
${inProgressSummary}

As COO, prioritize these tasks for today. For each task, provide:
1. Priority (high/medium/low)
2. A brief reason

If there are no tasks, suggest what each agent (hacker, hipster, hustler) should focus on today.`;

  const response = await askLlm([
    { role: "system", content: persona },
    { role: "user", content: prompt },
  ], { temperature: 0.4, maxTokens: 800 });

  await agent.log({
    agent_id: "coo",
    action: "standup_completed",
    details: { summary: response, taskCount: pending.length },
  });

  return response;
}

export async function prioritizeTasks(): Promise<Task[]> {
  const agent = new Agent("coo");
  const tasks = await agent.listTasks("", "pending");

  for (const task of tasks) {
    if (task.score !== null) continue;

    const result = calculateScore({
      title: task.title,
      description: task.description,
      agentId: task.agent_id,
    });

    const decision = evaluateThreshold(result.score);

    await agent.updateTask(task.id, {
      score: result.score,
    } as Partial<Task>);

    await agent.log({
      agent_id: "coo",
      task_id: task.id,
      action: "task_scored",
      details: { score: result.score, decision, reasoning: result.reasoning },
    });
  }

  return tasks;
}

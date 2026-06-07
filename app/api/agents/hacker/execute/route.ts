import { NextRequest, NextResponse } from "next/server";
import { HackerAgent } from "@/lib/agents/hacker/hacker-agent";
import { Agent } from "@/lib/agents";
import { logError } from "@/lib/error-logger";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.task_id && !body.title) {
      return NextResponse.json(
        { error: "task_id or title is required" },
        { status: 400 }
      );
    }

    let taskId = body.task_id;

    // If no task_id, create a new task first
    if (!taskId) {
      const agent = new Agent("hacker");
      const task = await agent.createTask({
        agent_id: "hacker",
        title: body.title,
        description: body.description,
      });
      taskId = task.id;
    }

    const hacker = new HackerAgent();
    const result = await hacker.execute(taskId);

    return NextResponse.json({ task_id: taskId, result });
  } catch (error) {
    logError("agents/hacker/execute", error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({ error: "Execution failed" }, { status: 500 });
  }
}

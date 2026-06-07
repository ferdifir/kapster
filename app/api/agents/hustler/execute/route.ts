import { NextRequest, NextResponse } from "next/server";
import { HustlerAgent } from "@/lib/agents/hustler/hustler-agent";
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

    if (!taskId) {
      const agent = new Agent("hustler");
      const task = await agent.createTask({
        agent_id: "hustler",
        title: body.title,
        description: body.description,
      });
      taskId = task.id;
    }

    const hustler = new HustlerAgent();
    const result = await hustler.execute(taskId);

    return NextResponse.json({ task_id: taskId, result });
  } catch (error) {
    logError("agents/hustler/execute", error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({ error: "Execution failed" }, { status: 500 });
  }
}

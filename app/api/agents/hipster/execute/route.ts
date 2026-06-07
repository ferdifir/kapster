import { NextRequest, NextResponse } from "next/server";
import { HipsterAgent } from "@/lib/agents/hipster/hipster-agent";
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
      const agent = new Agent("hipster");
      const task = await agent.createTask({
        agent_id: "hipster",
        title: body.title,
        description: body.description,
      });
      taskId = task.id;
    }

    const hipster = new HipsterAgent();
    const result = await hipster.execute(taskId);

    return NextResponse.json({ task_id: taskId, result });
  } catch (error) {
    logError("agents/hipster/execute", error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({ error: "Execution failed" }, { status: 500 });
  }
}

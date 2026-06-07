import { NextRequest, NextResponse } from "next/server";
import { Agent } from "@/lib/agents";
import { logError } from "@/lib/error-logger";

const agent = new Agent("api");

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get("agent_id") ?? undefined;
    const status = searchParams.get("status") ?? undefined;

    const tasks = await agent.listTasks(agentId, status);
    return NextResponse.json(tasks);
  } catch (error) {
    logError("agents/tasks/GET", error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.agent_id || !body.title) {
      return NextResponse.json({ error: "agent_id and title are required" }, { status: 400 });
    }

    const task = await agent.createTask({
      agent_id: body.agent_id,
      parent_task_id: body.parent_task_id,
      sub_agent_id: body.sub_agent_id,
      title: body.title,
      description: body.description,
    });

    await agent.log({
      agent_id: body.agent_id,
      task_id: task.id,
      action: "task_created",
      details: { title: body.title },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    logError("agents/tasks/POST", error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

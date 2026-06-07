import { NextRequest, NextResponse } from "next/server";
import { Agent } from "@/lib/agents";
import { logError } from "@/lib/error-logger";

const agent = new Agent("api");

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const task = await agent.getTask(id);

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json(task);
  } catch (error) {
    logError("agents/tasks/[id]/GET", error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const existing = await agent.getTask(id);

    if (!existing) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    await agent.updateTask(id, body);

    await agent.log({
      agent_id: existing.agent_id,
      task_id: id,
      action: "task_updated",
      details: { changes: body },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logError("agents/tasks/[id]/PATCH", error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

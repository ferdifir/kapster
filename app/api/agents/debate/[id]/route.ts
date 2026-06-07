import { NextRequest, NextResponse } from "next/server";
import * as debate from "@/lib/agents/debate/orchestrator";
import { logError } from "@/lib/error-logger";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await debate.getSession(id);
    if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(session);
  } catch (error) {
    logError("agents/debate/[id]/GET", error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({ error: "Failed to get debate" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (!body.agent_id || !body.position || !body.reasoning) {
      return NextResponse.json(
        { error: "agent_id, position, and reasoning are required" },
        { status: 400 }
      );
    }

    const session = await debate.submitArgument(id, {
      agentId: body.agent_id,
      position: body.position,
      reasoning: body.reasoning,
      dataPoints: body.data_points,
    });

    return NextResponse.json(session);
  } catch (error) {
    logError("agents/debate/[id]/POST", error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({ error: "Failed to submit argument" }, { status: 500 });
  }
}

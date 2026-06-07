import { NextRequest, NextResponse } from "next/server";
import * as debate from "@/lib/agents/debate/orchestrator";
import { logError } from "@/lib/error-logger";

export async function GET() {
  try {
    const sessions = await debate.listSessions();
    return NextResponse.json(sessions);
  } catch (error) {
    logError("agents/debate/GET", error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({ error: "Failed to list debates" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.topic || !body.participants || !body.initiated_by) {
      return NextResponse.json(
        { error: "topic, participants, and initiated_by are required" },
        { status: 400 }
      );
    }

    const id = await debate.initiate(body.topic, body.participants, body.initiated_by);
    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    logError("agents/debate/POST", error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({ error: "Failed to initiate debate" }, { status: 500 });
  }
}

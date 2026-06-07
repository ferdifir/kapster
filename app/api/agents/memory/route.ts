import { NextRequest, NextResponse } from "next/server";
import { Agent } from "@/lib/agents";
import { logError } from "@/lib/error-logger";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get("agent_id");
    const key = searchParams.get("key");

    if (!agentId || !key) {
      return NextResponse.json({ error: "agent_id and key are required" }, { status: 400 });
    }

    const agent = new Agent(agentId);
    const value = await agent.getMemory(key);

    return NextResponse.json({ key, value });
  } catch (error) {
    logError("agents/memory/GET", error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.agent_id || !body.key) {
      return NextResponse.json({ error: "agent_id and key are required" }, { status: 400 });
    }

    const agent = new Agent(body.agent_id);
    await agent.setMemory(body.key, body.value, body.expires_in_sec);

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    logError("agents/memory/POST", error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

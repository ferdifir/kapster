import { NextRequest, NextResponse } from "next/server";
import { Agent } from "@/lib/agents";
import { logError } from "@/lib/error-logger";

const agent = new Agent("coo");

export async function GET() {
  try {
    const blocked = await agent.listTasks("", "blocked");
    return NextResponse.json(blocked);
  } catch (error) {
    logError("agents/coo/escalation/GET", error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({ error: "Failed to list escalations" }, { status: 500 });
  }
}

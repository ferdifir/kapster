import { NextResponse } from "next/server";
import { CooAgent } from "@/lib/agents/coo/coo-agent";
import { logError } from "@/lib/error-logger";

export async function POST() {
  try {
    const coo = new CooAgent();
    const summary = await coo.standup();
    return NextResponse.json({ summary });
  } catch (error) {
    logError("agents/coo/standup", error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({ error: "Standup failed" }, { status: 500 });
  }
}

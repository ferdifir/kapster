import { NextResponse } from "next/server";
import { CooAgent } from "@/lib/agents/coo/coo-agent";
import { logError } from "@/lib/error-logger";

export async function GET() {
  try {
    const coo = new CooAgent();
    const status = await coo.getStatus();
    return NextResponse.json(status);
  } catch (error) {
    logError("agents/coo/status", error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({ error: "Failed to get status" }, { status: 500 });
  }
}

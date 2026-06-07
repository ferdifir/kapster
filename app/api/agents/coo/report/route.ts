import { NextResponse } from "next/server";
import { CooAgent } from "@/lib/agents/coo/coo-agent";
import { logError } from "@/lib/error-logger";

export async function GET() {
  try {
    const coo = new CooAgent();
    const report = await coo.getReport();
    return NextResponse.json({ report });
  } catch (error) {
    logError("agents/coo/report", error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
  }
}

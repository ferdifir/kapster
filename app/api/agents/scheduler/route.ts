import { NextResponse } from "next/server";
import { startDailyCycle } from "@/lib/agents/scheduler/daily-cycle";
import { logError } from "@/lib/error-logger";

export async function POST() {
  try {
    if (process.env.AGENTS_DISABLED === "true") {
      return NextResponse.json({ error: "Agents disabled" }, { status: 503 });
    }

    const summary = await startDailyCycle();
    return NextResponse.json({ summary });
  } catch (error) {
    logError("agents/scheduler/POST", error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({ error: "Daily cycle failed" }, { status: 500 });
  }
}

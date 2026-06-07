import { NextRequest, NextResponse } from "next/server";
import { CooAgent } from "@/lib/agents/coo/coo-agent";
import { logError } from "@/lib/error-logger";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.query) {
      return NextResponse.json({ error: "query is required" }, { status: 400 });
    }

    const coo = new CooAgent();
    const answer = await coo.ask(body.query);

    return NextResponse.json({ answer });
  } catch (error) {
    logError("agents/coo/ask", error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({ error: "Failed to respond" }, { status: 500 });
  }
}

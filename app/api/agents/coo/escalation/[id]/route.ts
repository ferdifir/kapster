import { NextRequest, NextResponse } from "next/server";
import { CooAgent } from "@/lib/agents/coo/coo-agent";
import { logError } from "@/lib/error-logger";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (!body.type || !body.content) {
      return NextResponse.json(
        { error: "type and content are required" },
        { status: 400 }
      );
    }

    const coo = new CooAgent();
    await coo.handleEscalation(id, {
      type: body.type,
      content: body.content,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logError("agents/coo/escalation/POST", error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({ error: "Failed to resolve escalation" }, { status: 500 });
  }
}

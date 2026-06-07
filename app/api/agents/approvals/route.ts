import { NextRequest, NextResponse } from "next/server";
import * as approvals from "@/lib/agents/decision/approval-queue";
import { logError } from "@/lib/error-logger";

export async function GET() {
  try {
    const pending = await approvals.getPending();
    return NextResponse.json(pending);
  } catch (error) {
    logError("agents/approvals/GET", error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({ error: "Failed to list approvals" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.id || !body.action) {
      return NextResponse.json({ error: "id and action are required" }, { status: 400 });
    }

    if (body.action === "approve") {
      await approvals.approve(body.id);
    } else if (body.action === "reject") {
      await approvals.reject(body.id);
    } else {
      return NextResponse.json({ error: "action must be approve or reject" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logError("agents/approvals/POST", error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({ error: "Failed to process approval" }, { status: 500 });
  }
}

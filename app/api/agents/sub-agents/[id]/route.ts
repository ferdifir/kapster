import { NextRequest, NextResponse } from "next/server";
import * as registry from "@/lib/agents/sub-agent/registry";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const sub = await registry.getById(id);
  if (!sub) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(sub);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  if (body.action === "suspend") {
    await registry.suspend(id);
    return NextResponse.json({ success: true });
  }

  if (body.action === "destroy") {
    await registry.destroy(id);
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

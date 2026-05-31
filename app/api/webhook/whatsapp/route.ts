import { NextRequest, NextResponse } from "next/server";
import { SYSTEM_WUZAPI_TOKEN } from "@/lib/wuzapi";
import { handleGroupInfo, handleMessage } from "@/lib/whatsapp-bot";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { type, event, token } = body;

  if (token !== SYSTEM_WUZAPI_TOKEN) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!event || typeof event !== "object") {
    return NextResponse.json({ error: "invalid event" }, { status: 400 });
  }

  if (type === "GroupInfo") {
    handleGroupInfo(event).catch(() => {});
  } else if (type === "Message") {
    handleMessage(event).catch(() => {});
  }

  return NextResponse.json({ received: true });
}

export async function GET() {
  return NextResponse.json({ ok: true });
}

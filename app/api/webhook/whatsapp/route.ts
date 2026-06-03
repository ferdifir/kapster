import { NextRequest, NextResponse } from "next/server";
import { SYSTEM_WUZAPI_TOKEN } from "@/lib/wuzapi";
import { handleGroupInfo, handleMessage } from "@/lib/whatsapp-bot";
import { handleDemoRequest, isPrivateMessage } from "@/lib/demo";
import { logError } from "@/lib/error-logger";

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch (err) {
    logError("webhook_whatsapp", err, { bodyRaw: await req.text().catch(() => "") });
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const { type, event, token } = body;

  if (token !== SYSTEM_WUZAPI_TOKEN) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!event || typeof event !== "object") {
    return NextResponse.json({ error: "invalid event" }, { status: 400 });
  }

  if (type === "GroupInfo") {
    handleGroupInfo(event as Record<string, unknown>).catch((err) => {
      logError("webhook_whatsapp_groupinfo", err);
    });
  } else if (type === "Message") {
    if (isPrivateMessage(event as Record<string, unknown>)) {
      handleDemoRequest(event as Record<string, unknown>).catch((err) => {
        logError("webhook_whatsapp_demo", err);
      });
    } else {
      handleMessage(event as Record<string, unknown>).catch((err) => {
        logError("webhook_whatsapp_message", err);
      });
    }
  } else {
    console.log(`[Webhook] Unknown event type: ${type}`);
  }

  return NextResponse.json({ received: true });
}

export async function GET() {
  return NextResponse.json({ ok: true });
}

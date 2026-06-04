import { NextRequest, NextResponse } from "next/server";
import { SYSTEM_WUZAPI_TOKEN } from "@/lib/wuzapi";
import { handleGroupInfo, handleMessage } from "@/lib/whatsapp-bot";
import { handleDemoRequest, isPrivateMessage } from "@/lib/demo";
import { logError } from "@/lib/error-logger";

function parseBody(
  body: Record<string, unknown>
): { type: string; event: Record<string, unknown> } | null {
  // WuzAPI global webhook format: { instanceName, jsonData, userID }
  if (typeof body.jsonData === "string") {
    try {
      const parsed = JSON.parse(body.jsonData) as Record<string, unknown>;
      if (
        typeof parsed.type === "string" &&
        parsed.event &&
        typeof parsed.event === "object"
      ) {
        return {
          type: parsed.type,
          event: parsed.event as Record<string, unknown>,
        };
      }
    } catch {
      return null;
    }
  }

  // Legacy format: { type, event, token }
  if (
    typeof body.type === "string" &&
    body.event &&
    typeof body.event === "object"
  ) {
    return {
      type: body.type,
      event: body.event as Record<string, unknown>,
    };
  }

  return null;
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch (err) {
    logError("webhook_whatsapp", err, { bodyRaw: await req.text().catch(() => "") });
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const { token } = body;
  const isInternal = req.headers.get("host")?.includes("localhost");

  // Only check token for external requests (per-session webhook from WuzAPI)
  if (!isInternal && token !== SYSTEM_WUZAPI_TOKEN) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const parsed = parseBody(body);
  if (!parsed) {
    return NextResponse.json({ error: "invalid event" }, { status: 400 });
  }

  const { type, event } = parsed;

  if (type === "GroupInfo") {
    handleGroupInfo(event).catch((err) => {
      logError("webhook_whatsapp_groupinfo", err);
    });
  } else if (type === "Message") {
    if (isPrivateMessage(event)) {
      handleDemoRequest(event).catch((err) => {
        logError("webhook_whatsapp_demo", err);
      });
    } else {
      handleMessage(event).catch((err) => {
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

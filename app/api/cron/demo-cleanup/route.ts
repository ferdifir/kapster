import { NextRequest, NextResponse } from "next/server";
import { processWaitlist } from "@/lib/demo";

const CRON_SECRET = process.env.CRON_SECRET;

async function handleCleanup(request: NextRequest) {
  const auth = request.headers.get("authorization")?.replace("Bearer ", "");
  if (auth !== CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await processWaitlist();
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[Cron] demo-cleanup failed:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return handleCleanup(request);
}

export async function POST(request: NextRequest) {
  return handleCleanup(request);
}

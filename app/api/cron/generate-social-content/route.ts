import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";
import path from "path";

const CRON_SECRET = process.env.CRON_SECRET;

function verifyAuth(request: NextRequest): boolean {
  const auth = request.headers.get("authorization")?.replace("Bearer ", "");
  return auth === CRON_SECRET;
}

function runGenerator() {
  const scriptPath = path.join(process.cwd(), "scripts/generate-social-content.ts");
  spawn("npx", ["tsx", scriptPath], {
    cwd: process.cwd(),
    stdio: "inherit",
    env: { ...process.env },
  });
}

export async function GET(request: NextRequest) {
  if (!verifyAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  runGenerator();
  return NextResponse.json({ ok: true, message: "Social content generation started" });
}

export async function POST(request: NextRequest) {
  if (!verifyAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  runGenerator();
  return NextResponse.json({ ok: true, message: "Social content generation started" });
}

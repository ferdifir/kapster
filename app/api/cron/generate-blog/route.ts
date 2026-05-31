import { NextRequest, NextResponse } from "next/server";

const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: NextRequest) {
  const auth = request.headers.get("authorization")?.replace("Bearer ", "");
  if (auth !== CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { spawn } = await import("child_process");
  const path = await import("path");

  const scriptPath = path.join(process.cwd(), "scripts/generate-blog-post.ts");

  spawn("npx", ["tsx", scriptPath], {
    cwd: process.cwd(),
    stdio: "inherit",
    env: { ...process.env },
  });

  return NextResponse.json({ ok: true, message: "Generation started" });
}

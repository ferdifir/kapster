import { NextResponse } from "next/server";
import * as git from "@/lib/agents/hacker/git-tools";
import * as pm2 from "@/lib/agents/hacker/pm2-tools";
import { logError } from "@/lib/error-logger";

export async function GET() {
  try {
    const gitStatus = await git.getStatus();
    const pm2Status = await pm2.getStatus();

    return NextResponse.json({
      git: gitStatus,
      pm2: pm2Status,
    });
  } catch (error) {
    logError("agents/hacker/status", error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({ error: "Failed to get status" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { execSync } from "child_process";

export async function POST(request: NextRequest) {
  try {
    const { command } = await request.json();
    if (!command || typeof command !== "string") {
      return NextResponse.json({ error: "Command diperlukan" }, { status: 400 });
    }

    const MAX_OUTPUT = 50000;
    const output = execSync(command, {
      timeout: 30000,
      maxBuffer: MAX_OUTPUT,
      shell: "/bin/bash",
      encoding: "utf-8",
    });

    return NextResponse.json({
      output: output.slice(0, MAX_OUTPUT),
      exitCode: 0,
    });
  } catch (err: unknown) {
    const error = err as { stderr?: string; stdout?: string; status?: number; message?: string };
    return NextResponse.json({
      output: (error.stderr || error.stdout || error.message || String(err)).slice(0, 50000),
      exitCode: error.status ?? 1,
    });
  }
}

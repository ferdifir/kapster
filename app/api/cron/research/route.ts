import { NextResponse } from "next/server";
import { execFile } from "child_process";

export const runtime = "nodejs";

export async function GET() {
  const scriptPath = `${process.cwd()}/scripts/generate-social-content.ts`;

  try {
    const stdout = await new Promise<string>((resolve, reject) => {
      execFile("npx", ["tsx", scriptPath, "--mode=research"], {
        timeout: 120000,
        env: { ...process.env },
      }, (err, stdout) => {
        if (err) reject(err);
        else resolve(stdout);
      });
    });

    return NextResponse.json({ ok: true, log: stdout.split("\n").filter(Boolean) });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

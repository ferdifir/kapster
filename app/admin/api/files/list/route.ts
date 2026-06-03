import { NextRequest, NextResponse } from "next/server";
import { execSync } from "child_process";

const ALLOWED_BASE = process.cwd();

export async function GET(request: NextRequest) {
  const path = request.nextUrl.searchParams.get("path") || ".";
  const fullPath = path.startsWith("/") ? path : `${ALLOWED_BASE}/${path.replace(/^\.\//, "")}`;

  try {
    const output = execSync(`ls -la --time-style=+"%Y-%m-%d %H:%M" "${fullPath}"`, { encoding: "utf-8" });
    const lines = output.trim().split("\n").slice(1);
    const files = lines.map((line) => {
      const parts = line.split(/\s+/);
      const perms = parts[0];
      const isDir = perms.startsWith("d");
      const size = parts[4];
      const date = parts[5] + " " + parts[6];
      const name = parts.slice(7).join(" ");
      return { name, perms, size, date, isDir };
    });

    return NextResponse.json({ files, currentPath: fullPath.replace(ALLOWED_BASE, "") || "/" });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

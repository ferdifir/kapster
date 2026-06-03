import { NextRequest, NextResponse } from "next/server";
import { readFileSync } from "fs";
import path from "path";

const ALLOWED_BASE = process.cwd();

export async function GET(request: NextRequest) {
  const filePath = request.nextUrl.searchParams.get("path") || "";
  const fullPath = filePath.startsWith("/") ? filePath : path.join(ALLOWED_BASE, filePath);
  try {
    const content = readFileSync(fullPath, "utf-8");
    return NextResponse.json({ content, path: fullPath });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

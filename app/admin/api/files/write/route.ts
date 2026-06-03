import { NextRequest, NextResponse } from "next/server";
import { writeFileSync } from "fs";
import path from "path";

const ALLOWED_BASE = process.cwd();

export async function POST(request: NextRequest) {
  try {
    const { path: filePath, content } = await request.json();
    const fullPath = filePath.startsWith("/") ? filePath : path.join(ALLOWED_BASE, filePath);
    writeFileSync(fullPath, content, "utf-8");
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

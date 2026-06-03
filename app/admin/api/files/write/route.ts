import { NextRequest, NextResponse } from "next/server";
import { writeFileSync } from "fs";

export async function POST(request: NextRequest) {
  try {
    const { path: filePath, content } = await request.json();
    writeFileSync(filePath, content, "utf-8");
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

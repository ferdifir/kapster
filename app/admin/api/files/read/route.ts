import { NextRequest, NextResponse } from "next/server";
import { readFileSync } from "fs";

export async function GET(request: NextRequest) {
  const filePath = request.nextUrl.searchParams.get("path") || "";
  try {
    const content = readFileSync(filePath, "utf-8");
    return NextResponse.json({ content, path: filePath });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

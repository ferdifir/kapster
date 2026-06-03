import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { initData } = await request.json();
    if (!initData) {
      return NextResponse.json({ error: "Missing initData" }, { status: 400 });
    }

    // Verify HMAC
    const params = new URLSearchParams(initData);
    const hash = params.get("hash");
    if (!hash) {
      return NextResponse.json({ error: "Missing hash" }, { status: 400 });
    }

    const userStr = params.get("user");
    if (!userStr) {
      return NextResponse.json({ error: "Missing user" }, { status: 400 });
    }

    const user = JSON.parse(userStr);
    const telegramId = String(user.id);

    const adminIds = (process.env.ADMIN_TELEGRAM_IDS || "").split(",").map((s) => s.trim());
    if (!adminIds.includes(telegramId)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    return NextResponse.json({ ok: true, telegram_id: telegramId, user: user });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

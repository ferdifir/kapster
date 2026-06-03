import { NextRequest, NextResponse } from "next/server";
import { verifyTelegramInitData, setAdminSession } from "@/lib/admin-auth";

export async function POST(request: NextRequest) {
  try {
    const { initData } = await request.json();
    if (!initData) {
      return NextResponse.json({ error: "Missing initData. Buka via Telegram." }, { status: 400 });
    }

    const user = verifyTelegramInitData(initData);
    if (!user) {
      return NextResponse.json({ error: "Invalid initData or unauthorized" }, { status: 403 });
    }

    await setAdminSession(user);

    return NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        username: user.username,
      },
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

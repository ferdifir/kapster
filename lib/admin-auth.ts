import { createHmac } from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const ADMIN_IDS = (process.env.ADMIN_TELEGRAM_IDS || "").split(",").map((s) => s.trim());
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";

export type AdminUser = {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
};

export function verifyTelegramInitData(initData: string): AdminUser | null {
  try {
    const params = new URLSearchParams(initData);
    const hash = params.get("hash");
    if (!hash) return null;

    const dataCheckString = Array.from(params.entries())
      .filter(([k]) => k !== "hash")
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join("\n");

    const secret = createHmac("sha256", "WebAppData").update(BOT_TOKEN).digest();
    const expectedHash = createHmac("sha256", secret).update(dataCheckString).digest("hex");

    if (expectedHash !== hash) return null;

    const userStr = params.get("user");
    if (!userStr) return null;

    const user: AdminUser = JSON.parse(userStr);
    if (!ADMIN_IDS.includes(String(user.id))) return null;

    return user;
  } catch {
    return null;
  }
}

export async function verifyAdminSession(): Promise<AdminUser | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session");
  if (!session) return null;
  try {
    return JSON.parse(Buffer.from(session.value, "base64").toString());
  } catch {
    return null;
  }
}

export async function setAdminSession(user: AdminUser, response?: NextResponse) {
  const value = Buffer.from(JSON.stringify(user)).toString("base64");
  const opts = { httpOnly: true, secure: true, sameSite: "lax" as const, maxAge: 60 * 60 * 24 };

  if (response) {
    response.cookies.set("admin_session", value, opts);
  } else {
    const cookieStore = await cookies();
    cookieStore.set("admin_session", value, opts);
  }
}

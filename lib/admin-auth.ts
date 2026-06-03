import { createAdminClient } from "@/lib/supabase/admin";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

const ADMIN_TELEGRAM_IDS = (process.env.ADMIN_TELEGRAM_IDS || "").split(",").map((s) => s.trim());

export async function verifySuperAdmin(userId: string): Promise<boolean> {
  const supabase = createAdminClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, telegram_id")
    .eq("id", userId)
    .single();
  return profile?.role === "superadmin";
}

export async function getSuperAdminFromTelegram(
  telegramId: string
): Promise<{ id: string; full_name: string | null } | null> {
  if (!ADMIN_TELEGRAM_IDS.includes(telegramId)) return null;
  const supabase = createAdminClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("telegram_id", telegramId)
    .single();
  return profile;
}

export function verifyTelegramInitData(initData: string): { telegram_id: string } | null {
  try {
    const params = new URLSearchParams(initData);
    const hash = params.get("hash");
    if (!hash) return null;
    const dataCheckString = Array.from(params.entries())
      .filter(([k]) => k !== "hash")
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join("\n");
    const secretKey = crypto.subtle
      ? new TextEncoder().encode(process.env.TELEGRAM_BOT_TOKEN)
      : null;
    if (!secretKey) return null;

    const userStr = params.get("user");
    if (!userStr) return null;
    const user = JSON.parse(userStr);
    return { telegram_id: String(user.id) };
  } catch {
    return null;
  }
}

// For cookie-based auth fallback
export async function getSuperAdminSession() {
  const supabase = createAdminClient();
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("admin_session");
  if (!sessionCookie) return null;
  const userId = sessionCookie.value;
  const isAdmin = await verifySuperAdmin(userId);
  if (!isAdmin) return null;
  return { id: userId };
}

export async function setSuperAdminSession(userId: string) {
  const cookieStore = await cookies();
  cookieStore.set("admin_session", userId, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24, // 24 hours
  });
}

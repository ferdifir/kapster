import { createAdminClient } from "@/lib/supabase/admin";
import { sendTextMessage, SYSTEM_WUZAPI_TOKEN } from "@/lib/wuzapi";
import { logError } from "@/lib/error-logger";

const DEMO_USER_ID = "0cb5f9fb-0930-46d3-bb4b-fb8030668d66";
const DEMO_EMAIL = "demo@kapster.my.id";
const DEMO_SESSION_MINUTES = 15;
const WAITLIST_CLAIM_MINUTES = 2;

export function generatePassword(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%";
  let result = "Demo@";
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function extractText(event: Record<string, unknown>): string {
  const msg = event.Message as Record<string, unknown> | undefined;
  if (!msg) return "";
  const conversation = msg.conversation as string | undefined;
  if (conversation) return conversation;
  const extended = msg.extendedTextMessage as Record<string, unknown> | undefined;
  if (extended?.text) return extended.text as string;
  return "";
}

export function isPrivateMessage(event: Record<string, unknown>): boolean {
  const info = event.Info as Record<string, unknown> | undefined;
  const chat = info?.Chat as string | undefined;
  return !!chat && !chat.includes("@g.us");
}

function extractJidPhone(jid: string): string {
  return jid.split(":")[0].split("@")[0];
}

export function getSenderPhone(event: Record<string, unknown>): string | null {
  const info = event.Info as Record<string, unknown> | undefined;
  if (!info) return null;

  const senderAlt = info.SenderAlt as string | undefined;
  if (senderAlt) return extractJidPhone(senderAlt);

  const sender = info.Sender as string | undefined;
  if (!sender) return null;
  return extractJidPhone(sender);
}

export function getChatJid(event: Record<string, unknown>): string | null {
  const info = event.Info as Record<string, unknown> | undefined;
  if (!info) return null;

  const chat = info.Chat as string | undefined;
  if (!chat) return null;

  // WuzAPI may send @lid format; prefer @s.whatsapp.net for replies
  if (chat.includes("@lid")) {
    const senderAlt = info.SenderAlt as string | undefined;
    if (senderAlt) {
      const phone = extractJidPhone(senderAlt);
      return `${phone}@s.whatsapp.net`;
    }
  }

  return chat;
}

export async function setDemoPassword(password: string): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(DEMO_USER_ID, { password });
  if (error) throw new Error(`Failed to set demo password: ${error.message}`);
}

export async function getActiveSession(): Promise<{
  id: string;
  phone: string;
  expires_at: string;
} | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("demo_sessions")
    .select("id, phone, expires_at")
    .eq("status", "active")
    .single();

  if (error && error.code !== "PGRST116") {
    logError("getActiveSession", error);
  }
  return data || null;
}

export async function createSession(
  phone: string,
  password: string
): Promise<{ id: string; expires_at: string }> {
  const expiresAt = new Date(Date.now() + DEMO_SESSION_MINUTES * 60 * 1000).toISOString();
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("demo_sessions")
    .insert({
      phone,
      temp_password: password,
      expires_at: expiresAt,
      status: "active",
      claimed_at: new Date().toISOString(),
    })
    .select("id, expires_at")
    .single();

  if (error) throw new Error(`Failed to create session: ${error.message}`);
  return data;
}

export async function addToWaitlist(phone: string): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin.from("demo_waitlist").insert({ phone, status: "waiting" });
  if (error) logError("addToWaitlist", error);
}

export async function isInWaitlist(phone: string): Promise<boolean> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("demo_waitlist")
    .select("id")
    .eq("phone", phone)
    .in("status", ["waiting", "notified"])
    .maybeSingle();
  return !!data;
}

export async function hasNotifiedStatus(phone: string): Promise<boolean> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("demo_waitlist")
    .select("id")
    .eq("phone", phone)
    .eq("status", "notified")
    .maybeSingle();
  return !!data;
}

export async function claimFromNotified(
  phone: string,
  password: string
): Promise<{ id: string; expires_at: string }> {
  const admin = createAdminClient();

  const session = await createSession(phone, password);

  const { error: delErr } = await admin
    .from("demo_waitlist")
    .delete()
    .eq("phone", phone)
    .eq("status", "notified");

  if (delErr) logError("claimFromNotified delete", delErr);

  return session;
}

export async function sendWaMessage(phone: string, message: string): Promise<void> {
  const token = SYSTEM_WUZAPI_TOKEN;
  if (!token) return;
  await sendTextMessage(token, phone, message);
}

export function formatEta(expiresAt: string): string {
  const remaining = Math.ceil(
    (new Date(expiresAt).getTime() - Date.now()) / 60000
  );
  const endTime = new Date(expiresAt).toLocaleTimeString("id-ID", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
  });
  return `~${remaining} menit (sekitar ${endTime} WIB)`;
}

export async function expireSession(sessionId: string): Promise<void> {
  const admin = createAdminClient();
  const newPassword = generatePassword();

  const { error } = await admin
    .from("demo_sessions")
    .update({ status: "expired", temp_password: newPassword })
    .eq("id", sessionId);

  if (error) {
    logError("expireSession", error);
    return;
  }

  await setDemoPassword(newPassword);
}

export async function processWaitlist(): Promise<void> {
  const admin = createAdminClient();

  const { data: expiredSessions, error: fetchError } = await admin
    .from("demo_sessions")
    .select("id")
    .eq("status", "active")
    .lt("expires_at", new Date().toISOString());

  if (fetchError) {
    logError("processWaitlist fetchSessions", fetchError);
    return;
  }

  if (expiredSessions && expiredSessions.length > 0) {
    for (const session of expiredSessions) {
      await expireSession(session.id);
    }

    const { data: nextInLine, error: waitlistFetchError } = await admin
      .from("demo_waitlist")
      .select("id, phone")
      .eq("status", "waiting")
      .order("created_at")
      .limit(1);

    if (waitlistFetchError) {
      logError("processWaitlist fetchWaitlist", waitlistFetchError);
      return;
    }

    if (nextInLine && nextInLine.length > 0) {
      const entry = nextInLine[0];
      const { error } = await admin
        .from("demo_waitlist")
        .update({ status: "notified", notified_at: new Date().toISOString() })
        .eq("id", entry.id);

      if (!error) {
        const jid = `${entry.phone}@s.whatsapp.net`;
        await sendWaMessage(
          jid,
          `\u{1F514} Akun demo sudah siap!\nKetik *demo* dalam ${WAITLIST_CLAIM_MINUTES} menit untuk mendapatkan akses.`
        );
      }
    }
  }

  const cutoff = new Date(
    Date.now() - WAITLIST_CLAIM_MINUTES * 60 * 1000
  ).toISOString();

  const { error: cleanupError } = await admin
    .from("demo_waitlist")
    .update({ status: "expired" })
    .eq("status", "notified")
    .lt("notified_at", cutoff);

  if (cleanupError) {
    logError("processWaitlist cleanup", cleanupError);
  }
}

async function removeFromWaitlist(phone: string): Promise<void> {
  const admin = createAdminClient();
  await admin.from("demo_waitlist").delete().eq("phone", phone);
}

export async function handleDemoRequest(event: Record<string, unknown>): Promise<void> {
  try {
    const text = extractText(event);
    const lower = text.trim().toLowerCase();
    const phone = getSenderPhone(event);
    const chatJid = getChatJid(event);
    if (!phone || !chatJid) return;

    if (lower === "batal") {
      const wasWaiting = await isInWaitlist(phone);
      if (wasWaiting) {
        await removeFromWaitlist(phone);
        await sendWaMessage(chatJid, "Baik, kamu sudah dihapus dari antrian demo.");
      }
      return;
    }

    if (lower !== "demo") return;

    const activeSession = await getActiveSession();

    if (activeSession) {
      const alreadyWaiting = await isInWaitlist(phone);
      if (alreadyWaiting) {
        await sendWaMessage(
          chatJid,
          "Kamu sudah dalam antrian, sabar ya \u{1F64F}"
        );
        return;
      }

      await addToWaitlist(phone);
      const eta = formatEta(activeSession.expires_at);
      await sendWaMessage(
        chatJid,
        `\u{23F3} Masih ada yang menggunakan akun demo.\nTersedia dalam ${eta}.\nKami akan kabari otomatis ketika sudah siap!\nBalas *batal* jika tidak jadi.`
      );
      return;
    }

    const isNotified = await hasNotifiedStatus(phone);
    const password = generatePassword();
    await setDemoPassword(password);

    if (isNotified) {
      await claimFromNotified(phone, password);
    } else {
      await createSession(phone, password);
    }

    const expiresAt = new Date(Date.now() + DEMO_SESSION_MINUTES * 60 * 1000);
    await sendWaMessage(
      chatJid,
      `\u{2705} *Akun Demo Kapster siap!*\n\nEmail: ${DEMO_EMAIL}\nPassword: ${password}\nLogin: https://kapster.my.id/auth/login\n\n\u{23F1} Berlaku ${DEMO_SESSION_MINUTES} menit (sampai ${expiresAt.toLocaleTimeString("id-ID", { timeZone: "Asia/Jakarta", hour: "2-digit", minute: "2-digit" })} WIB)`
    );
  } catch (err) {
    logError("handleDemoRequest", err, { event });
  }
}

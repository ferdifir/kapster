import { createAdminClient } from "@/lib/supabase/admin";
import { sendTextMessage, SYSTEM_WUZAPI_TOKEN } from "@/lib/wuzapi";
import { logError } from "@/lib/error-logger";

const DEMO_SESSION_MINUTES = 15;
const MAX_RETRIES = 5;

function generateRandomString(length: number): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function generatePassword(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%";
  return "Demo@" + generateRandomString(12);
}

function generateDemoEmail(): string {
  return `demo-${generateRandomString(8)}@kapster.my.id`;
}

type DemoSession = {
  id: string;
  phone: string;
  email: string | null;
  temp_password: string;
  expires_at: string;
  auth_user_id: string | null;
};

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

  if (chat.includes("@lid")) {
    const senderAlt = info.SenderAlt as string | undefined;
    if (senderAlt) {
      const phone = extractJidPhone(senderAlt);
      return `${phone}@s.whatsapp.net`;
    }
  }

  return chat;
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

async function createDemoUser(
  email: string,
  password: string
): Promise<string> {
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error) throw new Error(error.message);
  if (!data.user?.id) throw new Error("No user id returned");

  return data.user.id;
}

async function deleteDemoUser(authUserId: string): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(authUserId);
  if (error) logError("deleteDemoUser", error);
}

export async function getActiveSessionByPhone(
  phone: string
): Promise<DemoSession | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("demo_sessions")
    .select("id, phone, email, temp_password, expires_at, auth_user_id")
    .eq("phone", phone)
    .eq("status", "active")
    .maybeSingle();

  if (error && error.code !== "PGRST116") {
    logError("getActiveSessionByPhone", error);
  }
  return data || null;
}

export async function createSession(
  phone: string,
  email: string,
  authUserId: string,
  password: string
): Promise<void> {
  const expiresAt = new Date(Date.now() + DEMO_SESSION_MINUTES * 60 * 1000).toISOString();
  const admin = createAdminClient();
  const { error } = await admin.from("demo_sessions").insert({
    phone,
    email,
    auth_user_id: authUserId,
    temp_password: password,
    expires_at: expiresAt,
    status: "active",
  });

  if (error) throw new Error(`Failed to create session: ${error.message}`);
}

export async function cleanupExpiredSessions(): Promise<void> {
  const admin = createAdminClient();

  const { data: expiredSessions, error: fetchError } = await admin
    .from("demo_sessions")
    .select("id, auth_user_id")
    .eq("status", "active")
    .lt("expires_at", new Date().toISOString());

  if (fetchError) {
    logError("cleanupExpiredSessions fetch", fetchError);
    return;
  }

  if (!expiredSessions || expiredSessions.length === 0) return;

  for (const session of expiredSessions) {
    if (session.auth_user_id) {
      await deleteDemoUser(session.auth_user_id);
    }

    const { error: updateError } = await admin
      .from("demo_sessions")
      .update({ status: "expired" })
      .eq("id", session.id);

    if (updateError) {
      logError("cleanupExpiredSessions update", updateError);
    }
  }
}

export async function handleDemoRequest(event: Record<string, unknown>): Promise<void> {
  try {
    const text = extractText(event);
    const lower = text.trim().toLowerCase();
    const phone = getSenderPhone(event);
    const chatJid = getChatJid(event);
    if (!phone || !chatJid) return;
    if (lower !== "demo") return;

    // Cek apakah nomor ini sudah punya session aktif
    const existingSession = await getActiveSessionByPhone(phone);
    if (existingSession) {
      await sendWaMessage(
        chatJid,
        `Kamu masih punya sesi demo aktif!\n\nEmail: ${existingSession.email ?? "—"}\nPassword: ${existingSession.temp_password}\nLogin: https://kapster.my.id/auth/login\n\nBerlaku sampai ${formatEta(existingSession.expires_at)}`
      );
      return;
    }

    // Buat akun baru dengan retry logic
    let authUserId: string | null = null;
    let email = "";
    const password = generatePassword();

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      email = generateDemoEmail();
      try {
        authUserId = await createDemoUser(email, password);
        break;
      } catch (err) {
        const message = err instanceof Error ? err.message : "";
        if (message.includes("already exists") || message.includes("duplicate")) {
          if (attempt === MAX_RETRIES - 1) {
            logError("handleDemoRequest retry exhausted", err, { phone });
            await sendWaMessage(
              chatJid,
              "Maaf, terjadi kesalahan sistem. Silakan coba lagi nanti."
            );
            return;
          }
          continue;
        }
        logError("handleDemoRequest createUser", err, { phone });
        await sendWaMessage(
          chatJid,
          "Maaf, terjadi kesalahan sistem. Silakan coba lagi nanti."
        );
        return;
      }
    }

    if (!authUserId) {
      logError("handleDemoRequest no authUserId", new Error("Failed to create user after retries"), { phone });
      return;
    }

    await createSession(phone, email, authUserId, password);

    const expiresAt = new Date(Date.now() + DEMO_SESSION_MINUTES * 60 * 1000);
    await sendWaMessage(
      chatJid,
      `✅ *Akun Demo Kapster siap!*\n\nEmail: ${email}\nPassword: ${password}\nLogin: https://kapster.my.id/auth/login\n\n⏱ Berlaku ${DEMO_SESSION_MINUTES} menit (sampai ${expiresAt.toLocaleTimeString("id-ID", { timeZone: "Asia/Jakarta", hour: "2-digit", minute: "2-digit" })} WIB)`
    );
  } catch (err) {
    logError("handleDemoRequest", err, { event });
  }
}

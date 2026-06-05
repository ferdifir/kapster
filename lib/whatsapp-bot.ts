import { sendTextMessage, SYSTEM_WUZAPI_TOKEN, SYSTEM_WA_PHONE } from "@/lib/wuzapi";
import { askGroq } from "@/lib/groq";
import { logError } from "@/lib/error-logger";

const GROUP_JID = process.env.WHATSBOT_GROUP_JID || "";

function extractJidPhone(jid: string): string {
  return jid.split(":")[0].split("@")[0];
}

function extractText(event: Record<string, unknown>): string {
  const msg = event.Message as Record<string, unknown> | undefined;
  if (!msg) return "";

  const conversation = msg.conversation as string | undefined;
  if (conversation) return conversation;

  const extended = msg.extendedTextMessage as Record<string, unknown> | undefined;
  if (extended?.text) return extended.text as string;

  return "";
}

function hasAskTag(text: string): boolean {
  const lower = text.toLowerCase();
  return lower.includes("#ask") || lower.includes("#tanya");
}

function stripTag(text: string): string {
  return text.replace(/#ask/gi, "").replace(/#tanya/gi, "").trim();
}

export async function handleGroupInfo(event: Record<string, unknown>): Promise<void> {
  try {
    const groupJid = event.JID as string | undefined;
    if (!GROUP_JID || groupJid !== GROUP_JID) return;

    const joinList = event.Join as string[] | undefined;
    if (!joinList || joinList.length === 0) return;

    const token = SYSTEM_WUZAPI_TOKEN;
    if (!token) return;

    for (const jid of joinList) {
      const welcomeMessage =
        `Halo! Selamat datang di grup Kapster — komunitas pengguna sistem antrian digital untuk salon pria. Aku bot Kapster 🤖 Untuk bertanya seputar Kapster, cukup kirim pesan dengan #ask atau #tanya ya. Selamat bergabung! 🎉`;

      await sendTextMessage(token, groupJid, welcomeMessage);
      console.log(`[WhatsAppBot] Welcome sent to ${jid} in ${groupJid}`);
    }
  } catch (err) {
    logError("handleGroupInfo", err, { event });
  }
}

export async function handleMessage(event: Record<string, unknown>): Promise<void> {
  try {
    const info = event.Info as Record<string, unknown> | undefined;
    const groupJid = info?.Chat as string | undefined;
    if (!GROUP_JID || groupJid !== GROUP_JID) return;

    const senderJid = info?.Sender as string | undefined;
    if (senderJid && extractJidPhone(senderJid) === SYSTEM_WA_PHONE) return;

    const text = extractText(event);
    if (!text) return;

    if (!hasAskTag(text)) return;

    const question = stripTag(text);
    const token = SYSTEM_WUZAPI_TOKEN;
    if (!token) return;

    const answer = await askGroq(question);

    const stanzaId = info?.Id as string | undefined;
    const replyTo = stanzaId && senderJid ? { stanzaId, participant: senderJid } : undefined;
    await sendTextMessage(token, groupJid, answer, replyTo);
    console.log(`[WhatsAppBot] Answered in ${groupJid}: "${question.substring(0, 50)}"`);
  } catch (err) {
    logError("handleMessage", err, { event });
    try {
      const groupJid = ((event.Info as Record<string, unknown> | undefined)?.Chat as string | undefined);
      if (groupJid && SYSTEM_WUZAPI_TOKEN) {
        await sendTextMessage(
          SYSTEM_WUZAPI_TOKEN,
          groupJid,
          "Maaf, aku lagi sibuk. Coba #tanya lagi ya 😊"
        );
      }
    } catch {
      // silent
    }
  }
}

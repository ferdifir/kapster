const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID!;

export type InlineKeyboardButton = {
  text: string;
  callback_data: string;
};

export async function sendTelegramNotification(text: string): Promise<void> {
  await sendTelegramMessage(text, undefined);
}

export async function sendTelegramInlineKeyboard(
  text: string,
  buttons: InlineKeyboardButton[][],
  parse_mode: "HTML" | "Markdown" = "HTML"
): Promise<number | null> {
  return sendTelegramMessage(text, { inline_keyboard: buttons }, parse_mode);
}

export async function editTelegramMessage(
  chatId: number | string,
  messageId: number,
  text: string,
  parse_mode: "HTML" | "Markdown" = "HTML"
): Promise<void> {
  if (!TELEGRAM_BOT_TOKEN) return;
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/editMessageText`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      message_id: messageId,
      text,
      parse_mode,
    }),
  });
  if (!res.ok) {
    const errorBody = await res.text().catch(() => "");
    console.error("Telegram editMessageText error:", errorBody);
  }
}

export async function answerTelegramCallback(
  callbackQueryId: string,
  text?: string
): Promise<void> {
  if (!TELEGRAM_BOT_TOKEN) return;
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerCallbackQuery`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      callback_query_id: callbackQueryId,
      text: text || "",
    }),
  });
  if (!res.ok) {
    const errorBody = await res.text().catch(() => "");
    console.error("Telegram answerCallbackQuery error:", errorBody);
  }
}

export async function sendTelegramPhoto(
  buffer: Buffer,
  caption: string,
  buttons?: InlineKeyboardButton[][],
  parse_mode: "HTML" | "Markdown" = "HTML"
): Promise<number | null> {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.warn("Telegram not configured: missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID");
    return null;
  }

  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`;
    const form = new FormData();
    form.append("chat_id", TELEGRAM_CHAT_ID);
    form.append("photo", new Blob([buffer], { type: "image/png" }), "card.png");
    form.append("caption", caption);
    form.append("parse_mode", parse_mode);
    if (buttons) {
      form.append("reply_markup", JSON.stringify({ inline_keyboard: buttons }));
    }

    const res = await fetch(url, { method: "POST", body: form });

    if (!res.ok) {
      const errorBody = await res.text().catch(() => "");
      console.error("Telegram sendPhoto error:", errorBody);
      return null;
    }

    const data = await res.json();
    return data.result?.message_id ?? null;
  } catch (err) {
    console.error("Telegram sendPhoto failed:", err);
    return null;
  }
}

async function sendTelegramMessage(
  text: string,
  replyMarkup?: { inline_keyboard: InlineKeyboardButton[][] },
  parse_mode: "HTML" | "Markdown" = "HTML"
): Promise<number | null> {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.warn("Telegram not configured: missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID");
    return null;
  }

  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    const body: Record<string, unknown> = {
      chat_id: TELEGRAM_CHAT_ID,
      text,
      parse_mode,
    };
    if (replyMarkup) {
      body.reply_markup = replyMarkup;
    }

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errorBody = await res.text().catch(() => "");
      console.error("Telegram send error:", errorBody);
      return null;
    }

    const data = await res.json();
    return data.result?.message_id ?? null;
  } catch (err) {
    console.error("Telegram send failed:", err);
    return null;
  }
}

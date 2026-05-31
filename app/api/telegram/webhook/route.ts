import { NextRequest, NextResponse } from "next/server";
import { updateBlogPostStatus } from "@/lib/blog";
import { answerTelegramCallback, editTelegramMessage } from "@/lib/telegram";

function verifyTelegramRequest(request: NextRequest): boolean {
  const auth = request.headers.get("x-telegram-bot-api-secret-token");
  return auth === process.env.TELEGRAM_SECRET_TOKEN;
}

export async function POST(request: NextRequest) {
  if (!verifyTelegramRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();

    if (body.callback_query) {
      const { id: callbackId, data, message, from } = body.callback_query;

      if (!data || !message) {
        return NextResponse.json({ ok: true });
      }

      const [action, postId] = data.split(":");

      if (action === "blog_post" && postId) {
        await updateBlogPostStatus(postId, "published");
        await answerTelegramCallback(callbackId, "✅ Artikel dipublikasikan!");
        await editTelegramMessage(
          message.chat.id,
          message.message_id,
          `✅ Artikel <b>${message.text?.split("\n")[0] || ""}</b> telah dipublikasikan!`
        );
      } else if (action === "blog_cancel" && postId) {
        await updateBlogPostStatus(postId, "cancelled");
        await answerTelegramCallback(callbackId, "❌ Artikel dibatalkan.");
        await editTelegramMessage(
          message.chat.id,
          message.message_id,
          `❌ Artikel <b>${message.text?.split("\n")[0] || ""}</b> telah dibatalkan.`
        );
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[telegram-webhook] Error:", err);
    return NextResponse.json({ ok: true });
  }
}

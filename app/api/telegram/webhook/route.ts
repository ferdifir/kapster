import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { updateBlogPostStatus } from "@/lib/blog";
import { answerTelegramCallback, editTelegramMessage, sendTelegramMessage } from "@/lib/telegram";
import { revalidatePath } from "next/cache";

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
      const { id: callbackId, data, message } = body.callback_query;

      if (!data || !message) return NextResponse.json({ ok: true });

      const [action, postId] = data.split(":");

      if (action === "blog_post" && postId) {
        await updateBlogPostStatus(postId, "published");
        const { data: post } = await createAdminClient().from("blog_posts").select("slug").eq("id", postId).single();
        revalidatePath("/blog");
        if (post) revalidatePath(`/blog/${post.slug}`);
        await answerTelegramCallback(callbackId, "✅ Artikel dipublikasikan!");
        await editTelegramMessage(
          message.chat.id,
          message.message_id,
          `✅ Artikel <b>${message.text?.split("\n")[0] || ""}</b> telah dipublikasikan!`
        );
      } else if (action === "blog_cancel" && postId) {
        await updateBlogPostStatus(postId, "cancelled");
        revalidatePath("/blog");
        await answerTelegramCallback(callbackId, "❌ Artikel dibatalkan.");
        await editTelegramMessage(
          message.chat.id,
          message.message_id,
          `❌ Artikel <b>${message.text?.split("\n")[0] || ""}</b> telah dibatalkan.`
        );
      } else if (action === "social_post" && postId) {
        const parts = data.split(":");
        const newStatus = parts[2];
        const validStatuses = ["posted_ig", "posted_tt", "draft"];
        if (newStatus && validStatuses.includes(newStatus)) {
          const { error } = await createAdminClient().from("social_posts").update({ status: newStatus }).eq("id", postId);
          if (!error) {
            const label = { posted_ig: "📸 IG", posted_tt: "🎵 TikTok", draft: "⏳ Draft" };
            const platformHint = newStatus === "posted_ig" ? "Instagram" : newStatus === "posted_tt" ? "TikTok" : "";
            await answerTelegramCallback(callbackId, `✅ Status diubah ke ${label[newStatus as keyof typeof label] || newStatus}`);
            const linkRequest = newStatus !== "draft" ? `\n📎 Reply pesan ini dengan link ${platformHint}-nya buat analisa performa` : "";
            await editTelegramMessage(
              message.chat.id,
              message.message_id,
              `${message.text?.replace(/⏳ Status: .*$/, `✅ Status: <b>${label[newStatus as keyof typeof label] || newStatus}</b>`)}${linkRequest}`
            );
          } else {
            await answerTelegramCallback(callbackId, "❌ Gagal update status.");
          }
        }
      }
    }

    if (body.message?.text && body.message?.reply_to_message) {
      const repliedMsgId = body.message.reply_to_message.message_id;
      const { data: post, error } = await createAdminClient()
        .from("social_posts")
        .update({ post_url: body.message.text })
        .eq("telegram_msg_id", repliedMsgId)
        .is("post_url", null)
        .select("id")
        .single();

      if (!error && post) {
        await sendTelegramMessage("✅ Link tersimpan! Bisa dipake buat analisa performa.");
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[telegram-webhook] Error:", err);
    return NextResponse.json({ ok: true });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { updateBlogPostStatus } from "@/lib/blog";
import { answerTelegramCallback, editTelegramMessage } from "@/lib/telegram";
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
        // Fetch slug for cache revalidation
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
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[telegram-webhook] Error:", err);
    return NextResponse.json({ ok: true });
  }
}

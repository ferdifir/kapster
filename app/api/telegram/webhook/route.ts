import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { updateBlogPostStatus } from "@/lib/blog";
import { answerTelegramCallback, editTelegramMessage, sendTelegramMessage } from "@/lib/telegram";
import { revalidatePath } from "next/cache";
import { spawn } from "child_process";
import path from "path";

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

    // Handle /konten command — manual social content generation
    if (body.message?.text?.startsWith("/konten")) {
      const text = body.message.text.trim();
      const parts = text.split(/\s+/);
      const platform = parts[1]?.toLowerCase();

      if (platform !== "ig" && platform !== "tiktok") {
        await sendTelegramMessage(
          "Gunakan: <code>/konten [ig|tiktok] [opsional: topik]</code>\n\nContoh:\n<code>/konten ig</code> — konten Instagram, topik dari AI\n<code>/konten tiktok cara hitung omzet</code> — konten TikTok topik spesifik"
        );
        return NextResponse.json({ ok: true });
      }

      const topic = parts.slice(2).join(" ") || "";
      const platformFull = platform === "ig" ? "Instagram" : "TikTok";
      await sendTelegramMessage(`⏳ Lagi nulis konten ${platformFull}...${topic ? ` (topik: "${topic}")` : ""}`);

      // Spawn async — same pattern as cron endpoint
      const scriptPath = path.join(process.cwd(), "scripts/generate-social-content.ts");
      const spawnArgs = ["tsx", scriptPath, `--platform=${platform === "ig" ? "instagram" : "tiktok"}`];
      if (topic) spawnArgs.push(`--topic="${topic}"`);

      spawn("npx", spawnArgs, {
        cwd: process.cwd(),
        stdio: "inherit",
        env: { ...process.env },
        shell: true,
      });

      return NextResponse.json({ ok: true });
    }

    // Handle /admin command — open mini app
    if (body.message?.text === "/admin") {
      const chatId = body.message.chat.id;
      const adminIds = (process.env.ADMIN_TELEGRAM_IDS || "").split(",").map((s: string) => s.trim());
      const userId = body.message.from?.id?.toString();

      if (!userId || !adminIds.includes(userId)) {
        await sendTelegramMessage("⛔ Akses ditolak. Anda bukan admin.");
        return NextResponse.json({ ok: true });
      }

      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://kapster.my.id";
      await sendTelegramMessage(
        "🔐 <b>Admin Panel</b>\n\nKlik tombol di bawah untuk membuka panel admin:",
        {
          inline_keyboard: [[
            { text: "🚀 Buka Admin Panel", web_app: { url: `${appUrl}/admin` } },
          ]],
        }
      );

      return NextResponse.json({ ok: true });
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

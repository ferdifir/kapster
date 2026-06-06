import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { updateBlogPostStatus } from "@/lib/blog";
import { answerTelegramCallback, editTelegramMessage, sendTelegramMessage, parseCallbackData } from "@/lib/telegram";
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

      // --- Plan step approval callback ---
      const parsed = parseCallbackData(data || "");
      if (parsed.action === "plan_approve" || parsed.action === "plan_reject") {
        const stepId = parsed.payload.step_id;
        const planId = parsed.payload.plan_id;
        const supabase = createAdminClient();
        const anyDB = supabase as unknown as { from: (t: string) => { update: (v: Record<string, unknown>) => { eq: (c: string, v: string) => Promise<{ error: { message: string } | null }> }; insert: (v: Record<string, unknown>) => Promise<{ error: { message: string } | null }>; select: (c?: string) => { eq: (c: string, v: string) => Promise<{ data: Record<string, unknown> | null; error: { message: string } | null }> } } };

        await anyDB.from("agent_plan_steps").update({
          status: parsed.action === "plan_approve" ? "approved" : "skipped",
          approved_by: body.callback_query.from?.username || "unknown",
          approved_at: new Date().toISOString(),
        }).eq("id", stepId);

        const { data: plan } = await anyDB.from("agent_plans").select("agent_role").eq("id", planId);

        await anyDB.from("agent_events").insert({
          event_type: "telegram_feedback",
          source: "telegram",
          payload: {
            action: parsed.action,
            step_id: stepId,
            plan_id: planId,
            user: body.callback_query.from?.username || body.callback_query.from?.id?.toString(),
          },
          priority: 1,
          target_agent: plan?.agent_role || null,
          notes: `Plan step ${parsed.action === "plan_approve" ? "approved" : "skipped"} by ${body.callback_query.from?.username || "unknown"}`,
        } as Record<string, unknown>);

        const feedbackText = parsed.action === "plan_approve" ? "✅ Step disetujui, agent akan mengeksekusi" : "⏭️ Step dilewati";
        await answerTelegramCallback(callbackId, feedbackText);
        if (message?.message_id) {
          await editTelegramMessage(message.chat.id, message.message_id, `${feedbackText} — Step ID: ${stepId.slice(0, 8)}`);
        }
        return NextResponse.json({ ok: true });
      }

      if (parsed.action === "agent_approve" || parsed.action === "agent_reject" || parsed.action === "ferdi_done") {
        const eventId = parsed.payload.event_id;
        const supabase = createAdminClient();
        const agentEvents = supabase as unknown as { from: (t: string) => { insert: (v: Record<string, unknown>) => Promise<unknown> } };

        await agentEvents.from("agent_events").insert({
          event_type: "telegram_feedback",
          source: "telegram",
          payload: {
            callback_data: data,
            action: parsed.action,
            event_id: eventId,
            user: body.callback_query.from?.username || body.callback_query.from?.id?.toString(),
          },
          priority: 1,
          notes: `Telegram callback from ${body.callback_query.from?.username || "unknown"}: ${parsed.action}`,
        } as Record<string, unknown>);

        const feedbackText = parsed.action === "agent_approve" ? "✅ Disetujui" : parsed.action === "agent_reject" ? "❌ Ditolak" : "✅ Diterima";
        await answerTelegramCallback(callbackId, feedbackText);
        if (message?.message_id) {
          await editTelegramMessage(message.chat.id, message.message_id, `${feedbackText} — Feedback diteruskan ke agent.`);
        }

        return NextResponse.json({ ok: true });
      }
    }

    // --- NEW: Agent command handler ---
    if (body.message?.text) {
      const text = body.message.text;
      const isAgentCmd = text.startsWith("@hacker") || text.startsWith("@hipster") || text.startsWith("@hustler");

      if (isAgentCmd) {
        const supabase = createAdminClient();
        const agentEvents = supabase as unknown as { from: (t: string) => { insert: (v: Record<string, unknown>) => Promise<unknown> } };

        await agentEvents.from("agent_events").insert({
          event_type: "telegram_cmd",
          source: "telegram",
          payload: {
            text,
            from: body.message.from?.username || body.message.from?.id?.toString(),
            chat_id: body.message.chat.id,
          },
          priority: 2,
        } as Record<string, unknown>);

        await sendTelegramMessage("📨 Perintah diterima, diteruskan ke agent...");

        return NextResponse.json({ ok: true });
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

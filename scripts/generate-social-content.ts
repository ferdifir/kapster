import { createAdminClient } from "@/lib/supabase/admin";
import { sendTelegramPhoto } from "@/lib/telegram";
import { generateCardImage } from "./generate-card-image";
import { askOpenRouter } from "@/lib/ollama";
import { execFile } from "child_process";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const QA_MODEL = process.env.OPENROUTER_QA_MODEL || "openai/gpt-oss-120b:free";

interface SocialContentItem {
  platform: "instagram" | "tiktok" | "both";
  caption: string;
  hashtags: string[];
  content_type: "educational" | "solution";
  hook_type: string;
  trend_insight: string;
  topic: string;
  card_title: string;
  card_description: string;
}

const args = process.argv.slice(2);
const modeArg = args.find((a) => a.startsWith("--mode="))?.split("=")[1];
const platformArg = args.find((a) => a.startsWith("--platform="))?.split("=")[1];
const topicArg = args.find((a) => a.startsWith("--topic="))?.split("=")[1];

const IS_MANUAL = !!platformArg;
const TARGET_PLATFORM = platformArg || null;
const USER_TOPIC = topicArg || null;

async function main() {
  const supabase = await createAdminClient();

  if (modeArg === "research") {
    console.log("[social-gen] Mode: research");
    await runResearch(supabase);
    return;
  }

  console.log(`[social-gen] Starting at ${new Date().toISOString()}`);

  let brief: string;
  let planId: string | null = null;

  if (USER_TOPIC) {
    brief = `Topik dari user: ${USER_TOPIC}`;
  } else {
    const { data: pendingPlan, error: planError } = await supabase
      .from("content_plans")
      .select("id, brief")
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (planError) {
      console.error("[social-gen] Failed to fetch plans:", planError);
      return;
    }

    if (!pendingPlan) {
      console.log("[social-gen] No pending plans and no user topic. Running research on-demand...");
      await runResearch(supabase);
      console.log("[social-gen] Research done. Run again to generate.");
      return;
    }

    brief = pendingPlan.brief;
    planId = pendingPlan.id;
  }

  console.log(`[social-gen] Using brief: ${brief.slice(0, 100)}...`);
  console.log("[social-gen] Phase 2: Copy Generation...");

  const copyPrompt = `Kamu adalah copywriter sosial media untuk kapster.my.id — platform manajemen antrian barbershop Indonesia.

BRIEF DARI CONTENT PLANNER:
"""
${brief}
"""

TUGAS: Buat 1 caption ${TARGET_PLATFORM?.toUpperCase() || "INSTAGRAM"} berdasarkan brief di atas.

TARGET AUDIENS: Pemilik barbershop Indonesia usia 23-40 tahun

PANDUAN HOOK (PALING PENTING):
Hook harus SPESIFIK dan ANGKAT INSIGHT UNIK DARI BRIEF. Jangan generalisasi.
Gunakan salah satu formula:
- "Curiosity gap": "[Pain point spesifik dari brief]? Ternyata [insight dari brief]"
- "Problem-first": "Masalah [spesifik dari brief] yang bikin [dampak]"
- "Myth-bust": "Kamu pikir [common belief dari brief]? Justru sebaliknya"
- "Direct address": "[target audiens], [pain point spesifik dari brief]"
- "Question": "Pertanyaan spesifik yang terkait insight di brief"

GUIDELINES COPYWRITING:
1. Hook harus spesifik, pakai detail dari brief. JANGAN gunakan kata "optimalkan", "maksimalkan", "tingkatkan" sebagai hook.
2. Body (3-5 paragraf) — bahasa Indonesia santai, natural, kayak ngobrol.
3. CTA (1 kalimat terakhir).
4. TITLE untuk card — spesifik dari brief, muat 2 baris (7-14 kata).
5. DESCRIPTION: 1 baris, max 100 karakter.
6. Integrasi Kapster natural di bagian solusi.
7. 5-8 hashtag relevan.
8. JANGAN testimoni/data palsu.

Output JSON SAJA:
{"title": "hook spesifik untuk card", "description": "satu baris max 100 char", "caption": "caption lengkap", "hashtags": ["#tag1", "#tag2"], "content_type": "educational|solution"}`;

  const copyResponse = await callGroq(copyPrompt, 0.8, 1500);
  try {
    const cleaned = copyResponse.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
    const copyData = JSON.parse(cleaned);

    const item: SocialContentItem = {
      platform: (TARGET_PLATFORM as any) || "instagram",
      caption: copyData.caption,
      hashtags: copyData.hashtags || [],
      content_type: copyData.content_type || "educational",
      hook_type: "custom",
      trend_insight: brief,
      topic: copyData.title || brief.slice(0, 120),
      card_title: copyData.title || brief.slice(0, 120),
      card_description: copyData.description || "",
    };

    const review = await reviewContent(item);
    console.log(`[QA score ${review.score}/5]`);
    if (review.score < 4 && review.notes) {
      console.log(`[social-gen] QA score ${review.score}/5, regenerating...`);
      const regenPrompt = copyPrompt + `\n\nQA REVIEW (PERBAIKI):\n${review.notes}`;
      const regenRes = await callGroq(regenPrompt, 0.8, 1500);
      try {
        const regenCleaned = regenRes.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
        const regenData = JSON.parse(regenCleaned);
        item.caption = regenData.caption || item.caption;
        item.hashtags = regenData.hashtags || item.hashtags;
        item.card_title = regenData.title || item.card_title;
        item.card_description = regenData.description || item.card_description;
      } catch {
        console.warn(`[social-gen] Regen parse failed, keeping original for "${item.topic}"`);
      }
    }

    // Dedup
    const { data: existingPosts } = await supabase
      .from("social_posts")
      .select("topics")
      .gte("created_at", new Date(Date.now() - 14 * 86400000).toISOString());
    const existingTopics: string[] = existingPosts
    ?.flatMap((p: any) => (Array.isArray(p.topics) ? p.topics : []))
      .filter(Boolean) || [];

    const COMMON_WORDS = new Set(["barbershop", "digital", "manajemen", "antrian", "kapster", "tips", "cara", "dengan", "yang", "untuk", "dari", "ini", "agar", "biar", "saat", "tanpa", "lebih", "bikin", "bisa", "supaya", "indonesia", "online", "bisnis", "meningkatkan", "pendapatan", "teknologi", "waktu", "mengoptimalkan", "pengelolaan", "mengelola", "membantu", "memaksimalkan"]);

    function makeBigrams(words: string[]): Set<string> {
      const s = new Set<string>();
      for (let i = 0; i < words.length - 1; i++) s.add(`${words[i]} ${words[i + 1]}`);
      return s;
    }

    function getBigrams(topic: string): { words: string[]; bigrams: Set<string> } {
      const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim();
      const words = norm(topic).split(/\s+/).filter((w) => w.length > 3 && !COMMON_WORDS.has(w));
      return { words, bigrams: makeBigrams(words) };
    }

    function isDuplicate(topic: string): boolean {
      const { words, bigrams } = getBigrams(topic);
      if (words.length < 2) return false;
      for (const existing of existingTopics) {
        const { words: ew, bigrams: eb } = getBigrams(existing);
        if (ew.length < 2) continue;
        for (const b of bigrams) {
          if (eb.has(b)) return true;
        }
      }
      return false;
    }

    if (isDuplicate(item.topic)) {
      console.log(`[social-gen] Dedup: skipping "${item.topic}"`);
      if (planId) {
        await supabase.from("content_plans").update({ status: "used", used_at: new Date().toISOString() }).eq("id", planId);
      }
      return;
    }

    // Save to DB
    const insertData: any = {
      platform: item.platform,
      caption: item.caption,
      topics: [item.topic],
      content_type: item.content_type,
      trend_analysis: {
        hook_type: item.hook_type,
        trend_insight: item.trend_insight?.slice(0, 500),
        hashtags: item.hashtags,
      },
      status: "sent_to_telegram",
      scheduled_date: new Date().toISOString().split("T")[0],
    };
    if (planId) insertData.content_plan_id = planId;

    const { data: saved, error: saveError } = await supabase
      .from("social_posts").insert(insertData).select("id").single();

    if (saveError) {
      console.error("[social-gen] Save failed:", saveError);
      return;
    }

    if (planId) {
      await supabase.from("content_plans").update({ status: "used", used_at: new Date().toISOString() }).eq("id", planId);
    }

    console.log(`[social-gen] Saved: "${item.topic}" (${saved.id})`);

    await recordMetric(supabase, "posts_created", 1, {});
    await recordMetric(supabase, "qa_avg_score", review.score, { topic: item.topic });
    await recordMetric(supabase, "qa_regen_rate", review.score < 4 ? 1 : 0, {});

    // Card + Telegram (same as current implementation)
    console.log("[social-gen] Phase 5: Generating card images...");
    try {
      const pngBuffer = await generateCardImage({
        platform: TARGET_PLATFORM === "tiktok" ? "TT" : "IG",
        pillar: item.content_type === "educational" ? "Edukasi" : "Solusi",
        handle: process.env.SOCIAL_IG_USERNAME || "kapster.myid",
        title: item.card_title,
        description: item.card_description,
        topic: item.topic,
      });

      const fileName = `social/${saved.id}/card.png`;
      await supabase.storage.from("cover-images").upload(fileName, pngBuffer, { contentType: "image/png", upsert: true });
      const { data: publicUrl } = supabase.storage.from("cover-images").getPublicUrl(fileName);

      await supabase.from("social_posts").update({
        trend_analysis: { hook_type: item.hook_type, trend_insight: item.trend_insight?.slice(0, 500), hashtags: item.hashtags, image_url: publicUrl.publicUrl }
      }).eq("id", saved.id);

      console.log(`[social-gen] Card image: ${publicUrl.publicUrl}`);
    } catch (err) {
      console.error("[social-gen] Card gen failed:", err);
    }

    // Telegram
    console.log("[social-gen] Phase 6: Telegram Delivery...");
    try {
      const imgRes = await fetch(`https://arlpgnxtdbtvuxqvcytg.supabase.co/storage/v1/object/public/cover-images/social/${saved.id}/card.png`);
      if (imgRes.ok) {
        const photoBuffer = Buffer.from(await imgRes.arrayBuffer());
        const photoCaption = `${TARGET_PLATFORM === "tiktok" ? "🎵" : "📸"} <b>${TARGET_PLATFORM?.toUpperCase() || "IG"}</b> • <b>${item.content_type === "educational" ? "Edukasi" : "Solusi"}</b>\n\n${item.caption.length > 800 ? item.caption.slice(0, 800).replace(/\s+\S*$/, "") + "…" : item.caption}`;

        const msgId = await sendTelegramPhoto(photoBuffer, photoCaption, [
          [{ text: "📸 Sudah di-post IG", callback_data: `social_post:${saved.id}:posted_ig` }],
          [{ text: "⏳ Kembali ke Draft", callback_data: `social_post:${saved.id}:draft` }],
        ]);

        if (msgId) {
          await supabase.from("social_posts").update({ telegram_msg_id: msgId }).eq("id", saved.id);
        }
      }
    } catch (err) {
      console.error("[social-gen] Telegram failed:", err);
    }
  } catch (err) {
    console.error("[social-gen] Copy gen failed:", err);
    return;
  }

  await recordMetric(supabase, "unique_content_phrases", 1, {});
  await checkQualityAlerts(supabase);
  console.log("[social-gen] Done!");
}

// --- Agent Riset ---
async function runResearch(supabase: any) {
  console.log("[research] Fetching trends...");
  const trendPulsePath = `${process.cwd()}/.venv/bin/trend-pulse`;
  let rawTrends: string;
  try {
    rawTrends = await new Promise<string>((resolve, reject) => {
      execFile(trendPulsePath, [
        "trending", "--sources", "google_trends,google_news,reddit,wikipedia",
        "--geo", "ID", "--count", "10",
      ], { timeout: 25000 }, (err, stdout) => {
        if (err) reject(err);
        else resolve(stdout);
      });
    });
  } catch (err) {
    console.error("[research] Trend-Pulse failed:", err);
    await recordMetric(supabase, "research_failed", 1, { reason: "trend_pulse_failed" });
    return;
  }

  let trendContext = "";
  try {
    const parsed = JSON.parse(rawTrends);
    const sources = parsed.sources || {};
    const lines: string[] = [];
    for (const [src, items] of Object.entries(sources)) {
      const arr = items as Array<{ keyword: string; score?: number }>;
      if (arr?.length) {
        lines.push(`\n${src.toUpperCase()}:`);
        arr.slice(0, 8).forEach((i) => lines.push(`  - ${i.keyword}${i.score ? ` (score: ${i.score})` : ""}`));
      }
    }
    trendContext = lines.join("\n");
  } catch {
    trendContext = rawTrends.slice(0, 2000);
  }

  const { data: recentPosts } = await supabase
    .from("social_posts")
    .select("topics")
    .gte("created_at", new Date(Date.now() - 7 * 86400000).toISOString());
  const recentTopics = recentPosts
    ?.flatMap((p: any) => (Array.isArray(p.topics) ? p.topics : []))
    .filter(Boolean)
    .slice(0, 15) || [];

  const recentBlock = recentTopics.length
    ? `\nTopik yang sudah pernah dibuat (HINDARI):\n${recentTopics.map((t: string) => `  - ${t}`).join("\n")}`
    : "";

  const researchPrompt = `Kamu adalah content strategist untuk kapster.my.id.

Berikut data tren real dari Indonesia hari ini:

${trendContext}
${recentBlock}

TUGAS: Analisis untuk content planning.

Cara kerja:
- Cari koneksi NON-OBVOUS antara tren umum dan bisnis barbershop
- JANGAN paksa semua tren jadi topik — kalau tidak ada koneksi, bilang
- HINDARI topik yang mirip dengan daftar yang sudah pernah dibuat

Output bebas (bukan JSON): insight, pertanyaan, atau "Data tidak cukup"`;

  console.log("[research] Analyzing with LLM...");
  let brief: string;
  try {
    brief = await callGroq(researchPrompt, 0.8, 1500);
  } catch {
    console.error("[research] LLM failed");
    await recordMetric(supabase, "research_failed", 1, { reason: "llm_failed" });
    return;
  }

  if (brief.toLowerCase().includes("data tidak cukup")) {
    console.log("[research] Insufficient data, skipping");
    await recordMetric(supabase, "research_skipped", 1, {});
    return;
  }

  const { error } = await supabase.from("content_plans").insert({ brief });
  if (error) {
    console.error("[research] Save failed:", error);
    return;
  }
  console.log("[research] Plan saved");
  await recordMetric(supabase, "plans_created", 1, {});
  await recordMetric(supabase, "research_success", 1, {});
}

async function callGroq(prompt: string, temperature = 0.7, maxTokens = 4096): Promise<string> {
  if (!GROQ_API_KEY) throw new Error("GROQ_API_KEY not set");
  const res = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${GROQ_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [{ role: "system", content: "Jawab dalam Bahasa Indonesia." }, { role: "user", content: prompt }],
      max_tokens: maxTokens,
      temperature,
    }),
    signal: AbortSignal.timeout(120000),
  });
  if (!res.ok) throw new Error(`Groq error ${res.status}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

async function reviewContent(item: SocialContentItem): Promise<{ score: number; notes: string }> {
  const prompt = `Kamu adalah QA reviewer konten sosial media. Review berikut dan beri score 1-5.

KRITERIA:
1. HOOK SPESIFISITAS (0-2): Apakah hook spesifik, bukan generik?
2. STRUKTUR (0-1): Problem → Solution jelas?
3. NO FAKE CLAIMS (0-1): Tidak ada testimoni/data palsu?
4. TONE (0-1): Bahasa santai natural?

Title: "${item.card_title}"
Caption: "${item.caption.slice(0, 500)}"

Output JSON: {"score": 1-5, "notes": "..."}`;

  for (const api of ["openrouter", "groq"] as const) {
    try {
      const res = api === "openrouter"
        ? await askOpenRouter(prompt, { model: QA_MODEL, temperature: 0.3, max_tokens: 500 })
        : await callGroq(prompt, 0.3, 500);
      const cleaned = res.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
      const data = JSON.parse(cleaned);
      return { score: Math.max(1, Math.min(5, data.score || 3)), notes: data.notes || "" };
    } catch {
      if (api === "openrouter") console.warn("[social-gen] OpenRouter QA failed, falling back to Groq...");
    }
  }
  return { score: 3, notes: "QA gagal" };
}

async function recordMetric(supabase: any, metricName: string, metricValue: number, metadata?: Record<string, unknown>) {
  const today = new Date().toISOString().split("T")[0];
  try {
    await supabase.from("content_metrics").upsert(
      { metric_date: today, metric_name: metricName, metric_value: metricValue, metadata: metadata || {} },
      { onConflict: "metric_date,metric_name" }
    );
  } catch (err: any) {
    console.warn("[social-gen] Metric write failed:", err?.message || err);
  }
}

async function checkQualityAlerts(supabase: any) {
  const { data: recentTopics } = await supabase
    .from("social_posts")
    .select("topics")
    .gte("created_at", new Date(Date.now() - 7 * 86400000).toISOString());

  const allTopics: string[] = recentTopics
    ?.flatMap((p: any) => (Array.isArray(p.topics) ? p.topics : []))
    .filter(Boolean) || [];

  const templateCount = allTopics.filter((t) =>
    t.toLowerCase().includes("optimalkan") || t.toLowerCase().includes("maksimalkan")
  ).length;

  const templateRatio = allTopics.length > 0 ? templateCount / allTopics.length : 0;
  await recordMetric(supabase, "template_ratio", Math.round(templateRatio * 100), {});

  const threeDaysAgo = new Date(Date.now() - 3 * 86400000).toISOString().split("T")[0];
  const { data: scores } = await supabase
    .from("content_metrics")
    .select("metric_value, metric_date")
    .eq("metric_name", "qa_avg_score")
    .gte("metric_date", threeDaysAgo)
    .order("metric_date", { ascending: false })
    .limit(3);

  const lowScoreDays = scores?.filter((s: any) => s.metric_value < 4).length || 0;

  if (templateRatio > 0.2) {
    console.warn(`[monitor] ALERT: template_ratio = ${Math.round(templateRatio * 100)}% (> 20%)`);
    await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: process.env.TELEGRAM_CHAT_ID,
        text: `⚠️ *Content Quality Alert*\n\ntemplate_ratio: ${Math.round(templateRatio * 100)}% (target: <=20%)\n7 hari terakhir: ${templateCount}/${allTopics.length} topik mengandung 'optimalkan'/'maksimalkan'`,
        parse_mode: "Markdown",
      }),
    }).catch(() => {});
  }

  if (lowScoreDays >= 3) {
    console.warn(`[monitor] ALERT: QA score < 4 for ${lowScoreDays} consecutive days`);
    await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: process.env.TELEGRAM_CHAT_ID,
        text: `⚠️ *Content Quality Alert*\n\nQA score < 4 selama ${lowScoreDays} hari berturut-turut.\nPeriksa prompt riset atau kualitas brief.`,
        parse_mode: "Markdown",
      }),
    }).catch(() => {});
  }
}

main().catch((err) => {
  console.error("[social-gen] Fatal:", err);
  process.exit(1);
});

import { createAdminClient } from "@/lib/supabase/admin";
import { sendTelegramNotification } from "@/lib/telegram";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";
const GROQ_API_KEY = process.env.GROQ_API_KEY;

interface SocialContentItem {
  platform: "instagram" | "tiktok" | "both";
  caption: string;
  hashtags: string[];
  content_type: "educational" | "solution" | "social_proof";
  hook_type: string;
  trend_insight: string;
  topic: string;
}

async function main() {
  console.log(`[social-gen] Starting at ${new Date().toISOString()}`);
  const supabase = await createAdminClient();

  // Phase 1: Trend Research
  console.log("[social-gen] Phase 1: Trend Research...");
  const trendPrompt = `Kamu adalah analis tren media sosial untuk kapster.my.id, platform manajemen antrian digital untuk barbershop Indonesia.

TUGAS: Identifikasi 5 topik yang sedang tren atau relevan untuk barbershop di Indonesia hari ini.

Topik harus mencakup MIX dari 3 content pillar berikut:
1. EDUKASI BISNIS & MASALAH (35%) — tips kelola barbershop, bahaya antrian manual, hitung omzet, komisi kapster
2. SOLUSI & PRODUK (50%) — booking online, dashboard keuangan, antrian digital, harga Rp10.000/bulan
3. BUKTI & SOSIAL (15%) — testimoni, perbandingan sebelum-sesudah, social proof

Target pembaca: pemilik barbershop usia 23-40 di Indonesia.
Pain points: pelanggan kabur karena antrian, pendapatan bocor, bingung komisi kapster, ragu bayar software.

Berikan output JSON SAJA (tanpa markdown):
{"topics": [
  {"title": "judul topik", "pillar": "educational|solution|social_proof", "reasoning": "mengapa topik ini relevan hari ini", "platform_hint": "instagram|tiktok|both"}
]}

Pastikan variasi pillar sesuai persentase di atas untuk 5 topik.`;

  const trendResponse = await callGroq(trendPrompt, 0.8, 2000);
  let trendData: { topics: Array<{ title: string; pillar: string; reasoning: string; platform_hint: string }> };
  try {
    trendData = JSON.parse(trendResponse.trim());
  } catch {
    console.error("[social-gen] Failed to parse trend response:", trendResponse);
    throw new Error("Trend research failed");
  }
  console.log(`[social-gen] Found ${trendData.topics.length} trending topics`);

  // Phase 2: Content Selection — ensure pillar variety
  console.log("[social-gen] Phase 2: Content Selection...");
  const pillarPriority = ["social_proof", "educational", "solution"] as const;
  const sorted: typeof trendData.topics = [];
  for (const pillar of pillarPriority) {
    for (const t of trendData.topics) {
      if (t.pillar === pillar && !sorted.includes(t)) {
        sorted.push(t);
      }
    }
  }
  for (const t of trendData.topics) {
    if (!sorted.includes(t)) sorted.push(t);
  }
  const selectedTopics = sorted.slice(0, 4);
  console.log(`[social-gen] Selected ${selectedTopics.length} topics`);

  // Phase 3: Copy Generation
  console.log("[social-gen] Phase 3: Copy Generation...");
  const contents: SocialContentItem[] = [];

  const validPlatforms = new Set(["instagram", "tiktok", "both"]);
  const validPillars = new Set(["educational", "solution", "social_proof"]);

  function narrowPlatform(v: string): SocialContentItem["platform"] {
    return validPlatforms.has(v) ? v as SocialContentItem["platform"] : "instagram";
  }

  function narrowPillar(v: string): SocialContentItem["content_type"] {
    return validPillars.has(v) ? v as SocialContentItem["content_type"] : "educational";
  }

  for (const topic of selectedTopics) {
    const copyPrompt = `Kamu adalah copywriter sosial media untuk kapster.my.id — platform manajemen antrian barbershop Indonesia.

TUGAS: Buat caption sosial media untuk ${topic.platform_hint.toUpperCase()} tentang topik: "${topic.title}"

PILLAR KONTEN: ${topic.pillar}
TARGET AUDIENS: Pemilik barbershop Indonesia usia 23-40 tahun

STRUKTUR CAPTION (WAJIB):
1. HOOK (1-2 kalimat pertama) — gunakan salah satu: pertanyaan retoris, fakta mengejutkan, pain point, atau angka
2. BODY (3-5 paragraf pendek) — value-driven, jelaskan masalah → berikan solusi → kaitkan dengan Kapster
3. CTA (1 kalimat terakhir) — ajakan action

PANDUAN:
- Bahasa Indonesia santai, natural, ngobrol — bukan kaku
- Max 300 kata untuk Instagram, 200 karakter untuk TikTok
- Jika "both", prioritaskan versi IG (lebih panjang)
- Sertakan 10-15 hashtag relevan di baris terakhir
- Natural integrate Kapster sebagai solusi, jangan terlalu hard-sell

TREND INSIGHT: ${topic.reasoning}

Berikan output JSON SAJA:
{"caption": "caption lengkap", "hashtags": ["#tag1", "#tag2"], "hook_type": "question|fact|pain_point|statistic|story"}`;

    const copyResponse = await callGroq(copyPrompt, 0.8, 1500);
    try {
      const copyData = JSON.parse(copyResponse.trim());
      contents.push({
        platform: narrowPlatform(topic.platform_hint),
        caption: copyData.caption,
        hashtags: copyData.hashtags || [],
        content_type: narrowPillar(topic.pillar),
        hook_type: copyData.hook_type || "question",
        trend_insight: topic.reasoning,
        topic: topic.title,
      });
    } catch {
      console.error(`[social-gen] Failed to parse copy for: ${topic.title}`);
      continue;
    }
  }

  if (contents.length === 0) {
    console.log("[social-gen] No content generated, exiting.");
    return;
  }

  console.log(`[social-gen] Generated ${contents.length} content items`);

  // Phase 4: Send to Telegram
  console.log("[social-gen] Phase 4: Telegram Delivery...");
  const platformEmoji: Record<string, string> = { instagram: "📸", tiktok: "🎵", both: "📱" };
  const platformLabel: Record<string, string> = { instagram: "IG", tiktok: "TikTok", both: "IG + TikTok" };
  const pillarLabel: Record<string, string> = { educational: "Edukasi", solution: "Solusi", social_proof: "Bukti Sosial" };

  for (const item of contents) {
    const hashtagText = item.hashtags.map((h) => `#${h.replace(/^#/, "")}`).join(" ");
    const message = `${platformEmoji[item.platform]} <b>${platformLabel[item.platform]}</b> | <b>${pillarLabel[item.content_type]}</b>
─────────────────
${item.caption}

${hashtagText}
─────────────────
🔍 <b>Tren:</b> ${item.trend_insight}`;

    await sendTelegramNotification(message);
  }

  // Phase 5: Save to DB
  console.log("[social-gen] Phase 5: Saving to DB...");
  const today = new Date().toISOString().split("T")[0];
  for (const item of contents) {
    const { error } = await supabase.from("social_posts").insert({
      platform: item.platform,
      caption: item.caption,
      topics: [item.topic],
      content_type: item.content_type,
      trend_analysis: { hook_type: item.hook_type, trend_insight: item.trend_insight, hashtags: item.hashtags },
      status: "sent_to_telegram",
      scheduled_date: today,
    });
    if (error) {
      console.error(`[social-gen] DB insert error for "${item.topic}":`, error);
    } else {
      console.log(`[social-gen] Saved: "${item.topic}"`);
    }
  }

  console.log("[social-gen] Done!");
}

async function callGroq(prompt: string, temperature = 0.7, maxTokens = 4096) {
  if (!GROQ_API_KEY) throw new Error("GROQ_API_KEY not set");
  const res = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${GROQ_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        { role: "system", content: "Kamu adalah asisten konten Kapster untuk media sosial. Jawab dalam Bahasa Indonesia. Output informatif dan engaging." },
        { role: "user", content: prompt },
      ],
      max_tokens: maxTokens,
      temperature,
    }),
    signal: AbortSignal.timeout(120000),
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Groq API error ${res.status}: ${errText}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

main().catch((err) => {
  console.error("[social-gen] Fatal:", err);
  process.exit(1);
});

import { createAdminClient } from "@/lib/supabase/admin";
import { sendTelegramInlineKeyboard, sendTelegramPhoto } from "@/lib/telegram";
import { generateCardImage } from "./generate-card-image";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";
const GROQ_API_KEY = process.env.GROQ_API_KEY;

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

async function callGroq(prompt: string, temperature = 0.7, maxTokens = 4096) {
  if (!GROQ_API_KEY) throw new Error("GROQ_API_KEY not set");
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
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

      if (res.status === 429) {
        const retryAfter = parseInt(res.headers.get("Retry-After") || "30", 10);
        const waitMs = retryAfter * 1000 + 5000;
        console.log(`[social-gen] Rate limited, waiting ${waitMs / 1000}s...`);
        await new Promise((r) => setTimeout(r, waitMs));
        continue;
      }

      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        throw new Error(`Groq API error ${res.status}: ${errText}`);
      }

      const data = await res.json();
      return data.choices?.[0]?.message?.content ?? "";
    } catch (err) {
      if (attempt === 3) throw err;
      console.log(`[social-gen] Attempt ${attempt} failed, retrying in 10s...`);
      await new Promise((r) => setTimeout(r, 10000));
    }
  }
  throw new Error("Max retries exceeded");
}

function extractHook(caption: string): string {
  const sentences = caption.match(/[^.!?]+[.!?]+/g);
  if (!sentences) return caption.slice(0, 120);
  // Take first 1-2 sentences as hook (max ~200 chars)
  let hook = "";
  for (const s of sentences) {
    if ((hook + s).length > 200) break;
    hook += s;
  }
  return hook.trim() || sentences[0].trim();
}

// CLI args parsing (for manual trigger via /konten command)
const args = process.argv.slice(2);
const platformArg = args.find((a) => a.startsWith("--platform="))?.split("=")[1];
const topicArg = args.find((a) => a.startsWith("--topic="))?.split("=")[1];

const IS_MANUAL = !!platformArg; // false = cron mode (4 items), true = manual (1 item)
const TARGET_PLATFORM = platformArg || null; // "instagram" | "tiktok" | null
const USER_TOPIC = topicArg || null; // custom topic or null

async function main() {
  console.log(`[social-gen] Starting at ${new Date().toISOString()}`);
  const supabase = await createAdminClient();

  // Phase 1: Trend Research (skip if user provided a topic)
  const trendPrompt = USER_TOPIC
    ? null
    : `Kamu adalah analis tren media sosial untuk kapster.my.id, platform manajemen antrian digital untuk barbershop Indonesia.

TUGAS: Identifikasi 1 topik yang sedang relevan untuk barbershop di Indonesia hari ini untuk platform ${TARGET_PLATFORM || "media sosial"}.

Topik bisa berupa:
- EDUKASI — tips, cara, strategi kelola barbershop
- SOLUSI — manfaat solusi digital untuk barbershop

Target pembaca: pemilik barbershop usia 23-40 di Indonesia.
Pain points: pelanggan kabur karena antrian, pendapatan bocor, bingung komisi kapster, ragu bayar software.

Berikan output JSON SAJA (tanpa markdown):
{"topics": [
  {"title": "judul topik", "pillar": "educational|solution", "reasoning": "mengapa topik ini relevan"}
]}`;

  let trendData: { topics: Array<{ title: string; pillar: string; reasoning: string; platform_hint?: string }> };

  if (trendPrompt) {
    console.log(`[social-gen] Phase 1: Trend Research for ${TARGET_PLATFORM || "mixed"}...`);
    const trendResponse = await callGroq(trendPrompt, 0.8, 1000);
    try {
      trendData = JSON.parse(trendResponse.trim());
    } catch {
      console.error("[social-gen] Failed to parse trend response:", trendResponse);
      throw new Error("Trend research failed");
    }
  } else {
    // User provided topic — use it directly
    trendData = {
      topics: [{ title: USER_TOPIC!, pillar: "solution", reasoning: "Topik dari user" }],
    };
  }

  console.log(`[social-gen] Using ${trendData.topics.length} topic(s)`);

  // Phase 2: Content Selection
  console.log("[social-gen] Phase 2: Content Selection...");
  const selectedTopics = IS_MANUAL
    ? [trendData.topics[0]] // Manual mode: just 1 item
    : trendData.topics.slice(0, 4); // Cron mode: up to 4 items

  // Phase 3: Copy Generation
  console.log("[social-gen] Phase 3: Copy Generation...");
  const contents: SocialContentItem[] = [];

  const validPlatforms = new Set(["instagram", "tiktok", "both"]);
  const validPillars = new Set(["educational", "solution"]);

  function narrowPlatform(v: string): SocialContentItem["platform"] {
    return validPlatforms.has(v) ? v as SocialContentItem["platform"] : "instagram";
  }

  function narrowPillar(v: string): SocialContentItem["content_type"] {
    return validPillars.has(v) ? v as SocialContentItem["content_type"] : "educational";
  }

  for (const topic of selectedTopics) {
    const platformStr = IS_MANUAL ? TARGET_PLATFORM!.toUpperCase() : topic.platform_hint?.toUpperCase() || "INSTAGRAM";
    const copyPrompt = `Kamu adalah copywriter sosial media untuk kapster.my.id — platform manajemen antrian barbershop Indonesia.

TUGAS: Buat 1 caption ${platformStr} tentang topik: "${topic.title}"

TARGET AUDIENS: Pemilik barbershop Indonesia usia 23-40 tahun

FORMAT KONTEN: ${topic.pillar === "solution" ? "Solusi" : "Edukasi"}

GUIDELINES COPYWRITING:
1. Gunakan framework PAS (Problem → Agitation → Solution) atau AIDA (Attention → Interest → Desire → Action)
2. HOOK (1-2 kalimat pertama) — strong, relatable, pake pertanyaan retoris atau pain point
3. BODY (3-5 paragraf pendek) — bahasa Indonesia santai, natural, kayak ngobrol. Ceritakan masalah → perparah → kasih solusi
4. CTA (1 kalimat terakhir) — ajakan action yang jelas
5. TITLE/HOOK untuk card: max 10 KATA, harus menarik perhatian
6. DESCRIPTION: 1 baris max 100 karakter, menjelaskan isi konten
7. Integrasi Kapster natural (jangan hard-sell). Kapster disebut di bagian solusi.
8. 5-8 hashtag relevan (campuran Indonesia & Inggris)
9. Max 300 kata untuk Instagram, 200 karakter untuk TikTok
10. JANGAN gunakan testimoni palsu, data palsu, atau klaim tanpa sumber

TREND INSIGHT: ${topic.reasoning}

Berikan output JSON SAJA:
{"title": "hook untuk card max 10 kata", "description": "satu baris desc max 100 char", "caption": "caption lengkap", "hashtags": ["#tag1", "#tag2"], "content_type": "educational|solution"}`;

    const copyResponse = await callGroq(copyPrompt, 0.8, 1500);
    try {
      const copyData = JSON.parse(copyResponse.trim());
      contents.push({
        platform: narrowPlatform(IS_MANUAL ? TARGET_PLATFORM! : topic.platform_hint || "instagram"),
        caption: copyData.caption,
        hashtags: copyData.hashtags || [],
        content_type: narrowPillar(topic.pillar),
        hook_type: copyData.hook_type || "question",
        trend_insight: topic.reasoning,
        topic: topic.title,
        card_title: copyData.title || extractHook(copyData.caption),
        card_description: copyData.description || extractDescription(copyData.caption),
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

  // Phase 4: Save to DB first (get IDs)
  console.log("[social-gen] Phase 4: Saving to DB...");
  const today = new Date().toISOString().split("T")[0];

  interface SavedPost {
    id: string;
    item: SocialContentItem;
  }
  const savedPosts: SavedPost[] = [];

  for (const item of contents) {
    const { data, error } = await supabase.from("social_posts").insert({
      platform: item.platform,
      caption: item.caption,
      topics: [item.topic],
      content_type: item.content_type,
      trend_analysis: { hook_type: item.hook_type, trend_insight: item.trend_insight, hashtags: item.hashtags },
      status: "sent_to_telegram",
      scheduled_date: today,
    }).select("id").single();

    if (error) {
      console.error(`[social-gen] DB insert error for "${item.topic}":`, error);
    } else {
      savedPosts.push({ id: data.id, item });
      console.log(`[social-gen] Saved: "${item.topic}" (${data.id})`);
    }
  }

  // Phase 5: Generate card images via satori + resvg
  console.log("[social-gen] Phase 5: Generating card images...");
  const platformLabel: Record<string, string> = { instagram: "IG", tiktok: "TT", both: "IG+TT" };
  const pillarLabel: Record<string, string> = { educational: "Edukasi", solution: "Solusi" };
  const igUser = process.env.SOCIAL_IG_USERNAME || "kapster.myid";
  const ttUser = process.env.SOCIAL_TT_USERNAME || "kapster.my.id";
  const socialHandle: Record<string, string> = {
    instagram: igUser,
    tiktok: ttUser,
    both: `${igUser} & ${ttUser}`,
  };

  function extractDescription(caption: string): string {
    const sentences = caption.match(/[^.!?]+[.!?]+/g);
    if (!sentences || sentences.length < 2) return "Simak selengkapnya di caption!";
    const bodySentence = sentences.length > 2 ? sentences[2] : sentences[1];
    return bodySentence.trim().slice(0, 200);
  }

  for (const { id, item } of savedPosts) {
    try {
      const hook = item.card_title || extractHook(item.caption);
      const description = item.card_description || extractDescription(item.caption);
      const pngBuffer = await generateCardImage({
        platform: platformLabel[item.platform],
        pillar: pillarLabel[item.content_type],
        handle: socialHandle[item.platform],
        title: hook,
        description,
        topic: item.topic,
      });

      // Upload to Supabase Storage
      const fileName = `social/${id}/card.png`;
      const { error: uploadError } = await supabase.storage
        .from("cover-images")
        .upload(fileName, pngBuffer, { contentType: "image/png", upsert: true });

      if (uploadError) {
        console.error(`[social-gen] Upload failed for "${item.topic}":`, uploadError);
        continue;
      }

      const { data: publicUrl } = supabase.storage.from("cover-images").getPublicUrl(fileName);

      await (supabase.from("social_posts") as any).update({
        trend_analysis: { image_url: publicUrl.publicUrl },
      }).eq("id", id);

      console.log(`[social-gen] Card image: ${publicUrl.publicUrl}`);
    } catch (err) {
      console.error(`[social-gen] Card image generation failed for "${item.topic}":`, err);
    }
  }

  // Phase 6: Send to Telegram (photo + text with buttons)
  console.log("[social-gen] Phase 6: Telegram Delivery...");
  const platformEmoji: Record<string, string> = { instagram: "📸", tiktok: "🎵", both: "📱" };
  const platformLabelFull: Record<string, string> = { instagram: "IG", tiktok: "TikTok", both: "IG + TikTok" };
  const pillarLabelFull: Record<string, string> = { educational: "Edukasi", solution: "Solusi" };

  for (const { id, item } of savedPosts) {
    // Get image URL from DB
    const { data: post } = await supabase.from("social_posts").select("trend_analysis").eq("id", id).single();
    const imageUrl = (post?.trend_analysis as Record<string, unknown> | undefined)?.image_url as string | undefined;

    // Download image from storage
    let photoBuffer: Buffer | null = null;
    if (imageUrl) {
      try {
        const imgRes = await fetch(imageUrl);
        if (imgRes.ok) {
          photoBuffer = Buffer.from(await imgRes.arrayBuffer());
        }
      } catch {
        console.warn(`[social-gen] Failed to download image for "${item.topic}"`);
      }
    }

    const hashtagText = item.hashtags.map((h) => `#${h.replace(/^#/, "")}`).join(" ");
    const fullText = `${platformEmoji[item.platform]} <b>${platformLabelFull[item.platform]}</b> | <b>${pillarLabelFull[item.content_type]}</b>
─────────────────
${item.caption}

${hashtagText}
─────────────────
🔍 <b>Tren:</b> ${item.trend_insight}

─────────────────
⏳ Status: <b>sent_to_telegram</b>`;

    if (photoBuffer) {
      // Send photo with caption + buttons
      const photoCaption = `${platformEmoji[item.platform]} <b>${platformLabelFull[item.platform]}</b> • <b>${pillarLabelFull[item.content_type]}</b>
  
${item.caption.length > 800 ? item.caption.slice(0, 800).replace(/\s+\S*$/, "") + "…\n\n📝 <i>Lanjutan caption di bawah</i>" : item.caption}`;

      const msgId = await sendTelegramPhoto(photoBuffer, photoCaption, [
        [
          { text: "📸 Sudah di-post IG", callback_data: `social_post:${id}:posted_ig` },
          { text: "🎵 Sudah di-post TT", callback_data: `social_post:${id}:posted_tt` },
        ],
        [
          { text: "⏳ Kembali ke Draft", callback_data: `social_post:${id}:draft` },
        ],
      ]);

      if (msgId) {
        await supabase.from("social_posts").update({ telegram_msg_id: msgId }).eq("id", id);
      }

      // If caption was truncated, send full text as follow-up
      if (item.caption.length > 800) {
        await sendTelegramInlineKeyboard(fullText, [
          [
            { text: "📸 Sudah di-post IG", callback_data: `social_post:${id}:posted_ig` },
            { text: "🎵 Sudah di-post TT", callback_data: `social_post:${id}:posted_tt` },
          ],
          [
            { text: "⏳ Kembali ke Draft", callback_data: `social_post:${id}:draft` },
          ],
        ]);
      }
    } else {
      // Fallback: send text only (no image)
      const msgId = await sendTelegramInlineKeyboard(fullText, [
        [
          { text: "📸 Sudah di-post IG", callback_data: `social_post:${id}:posted_ig` },
          { text: "🎵 Sudah di-post TT", callback_data: `social_post:${id}:posted_tt` },
        ],
        [
          { text: "⏳ Kembali ke Draft", callback_data: `social_post:${id}:draft` },
        ],
      ]);

      if (msgId) {
        await supabase.from("social_posts").update({ telegram_msg_id: msgId }).eq("id", id);
      }
    }
  }

  console.log(`[social-gen] Done! Generated ${savedPosts.length} items (${IS_MANUAL ? "manual" : "cron"})`);
}

main().catch((err) => {
  console.error("[social-gen] Fatal:", err);
  process.exit(1);
});

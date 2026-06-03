import { createAdminClient } from "@/lib/supabase/admin";
import { sendTelegramInlineKeyboard } from "@/lib/telegram";
import { recordMetric, checkQualityAlerts } from "@/lib/metrics";
import { askOpenRouter, askOllamaWithSystem } from "@/lib/ollama";
import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";
const SITE_URL = "https://kapster.my.id";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MCP_SERVER_PATH = path.resolve(__dirname, "../mcp-servers/content-researcher/dist/index.js");

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const PUTER_AUTH_TOKEN = process.env.PUTER_AUTH_TOKEN;
const TREND_PULSE_PATH = process.env.TREND_PULSE_PATH || "/var/www/kapster/.venv/bin/trend-pulse";

interface ResearchResult {
  topicData: { topic: string; title: string; reasoning: string; seo_keywords: string[] };
  webResearchData: string;
  planId: string;
  brief: string;
}

async function main() {
  console.log(`[blog-gen] Starting at ${new Date().toISOString()}`);
  const supabase = await createAdminClient();

  // Phase 1: Research
  console.log("[blog-gen] Phase 1: Research...");
  const research = await researchPhase(supabase);
  if (!research) {
    console.log("[blog-gen] Research failed or no topic found, skipping.");
    await recordMetric(supabase, "research_skipped", 1, {});
    return;
  }

  const { topicData, webResearchData, planId } = research;
  console.log(`[blog-gen] Topic: ${topicData.title} (${topicData.reasoning})`);

  // Phase 2: Content Generation + SEO Metadata (merged)
  console.log("[blog-gen] Phase 2: Generating article...");
  const contentPrompt = `Kamu adalah penulis konten ahli untuk blog kapster.my.id — platform manajemen antrian digital untuk barbershop Indonesia.

Judul: "${topicData.title}"

[WAJIB] Artikel HARUS MINIMAL 3000 KATA. Target 5000+ kata. Jangan berhenti sampai mencapai target panjang ini. Tulis panjang, mendalam, dan komprehensif.

GAYA: Seperti tulisan MAJALAH — natural, engaging, dengan celotehan atau humor ringan. Bayangkan kamu jelasin ke teman yang punya barbershop.

PANDUAN KONTEN:
1. Jawab judul dengan contoh nyata, studi kasus, data spesifik, atau cerita — bukan saran generik
2. Minimal 5 sub-bab <h2>, masing-masing 400-800 kata, dengan variasi panjang
3. Per sub-bab: minimal 200 kata konten informatif (bukan format HTML kosong)
4. Semakin panjang semakin bagus. Artikel 5000+ kata jauh lebih bernilai dari 3000 kata

ATURAN FORMAT:
- HTML: h2, h3, p, strong, em, ul, ol, li, blockquote, table, thead, tbody, tr, th, td, a
- JANGAN markdown. JANGAN <h1>
- Minimal 1 <ul>, 1 <ol>, 1 <blockquote>, 1 <table>
- Gunakan <strong> untuk keyword penting

CTA di akhir:
<p>Kalau kamu ingin fokus mengembangkan bisnis barbershop tanpa pusing urus antrian, coba deh pakai Kapster. Sistem antrian digital yang bikin pelanggan puas dan operasional makin rapi. Cuma Rp10.000/bulan. Mulai gratis di ${SITE_URL}!</p>

SETELAH artikel (di baris terakhir), sertakan metadata:
---METADATA
{"excerpt": "ringkasan artikel 150-200 karakter (bukan judul ulang)", "meta_description": "meta description 150-160 karakter untuk SEO", "slug": "url-slug-pendek-dan-relevan", "keywords": ["kw1","kw2","kw3","kw4","kw5","kapaster"], "topics": ["topik1"], "seo_score": 85}`;

  const fullResponse = await callLLM(contentPrompt, 0.8, 8192);

  // Split article and metadata
  const metaMatch = fullResponse.match(/---+\s*METADATA\s*\n({[\s\S]*})/i);
  let contentHtml = fullResponse;
  let seoData: any = {};
  if (metaMatch) {
    contentHtml = fullResponse.slice(0, metaMatch.index).trim();
    try {
      seoData = JSON.parse(metaMatch[1].trim());
    } catch {
      seoData = {};
    }
  }
  if (!seoData.slug) {
    const text = contentHtml.replace(/<[^>]*>/g, "");
    seoData = {
      excerpt: text.slice(0, 200),
      meta_description: text.slice(0, 160),
      slug: topicData.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
      keywords: topicData.seo_keywords || [],
      topics: ["barbershop"],
      seo_score: 80,
    };
  }

  console.log(`[blog-gen] Content: ${contentHtml.length} chars`);
  console.log(`[blog-gen] Slug: ${seoData.slug}`);

  // Phase 2.5: QA Review
  console.log("[blog-gen] Phase 2.5: QA review...");
  const qaResult = await reviewBlogContent(contentHtml, topicData.title);
  await recordMetric(supabase, "qa_avg_score", qaResult.score, { title: topicData.title });

  if (qaResult.score < 4) {
    console.log(`[blog-gen] QA score ${qaResult.score}/5, regenerating with fix notes...`);
    const fixedPrompt = contentPrompt + `\n\nQA REVIEW NOTES (PERBAIKI):\n${qaResult.notes}`;
    const fixedResponse = await callLLM(fixedPrompt, 0.8, 8192);
    const fixedMetaMatch = fixedResponse.match(/---+\s*METADATA\s*\n({[\s\S]*})/i);
    if (fixedMetaMatch) {
      contentHtml = fixedResponse.slice(0, fixedMetaMatch.index).trim();
      try { seoData = JSON.parse(fixedMetaMatch[1].trim()); } catch {}
    } else {
      contentHtml = fixedResponse.trim();
    }
    console.log(`[blog-gen] Regenerated: ${contentHtml.length} chars`);
    await recordMetric(supabase, "qa_regen_rate", 1, { title: topicData.title });
  }

  // Phase 2.75: Length check — extend until 3000+ words
  const wordCount = contentHtml.replace(/<[^>]*>/g, "").split(/\s+/).length;
  if (wordCount < 3000) {
    console.log(`[blog-gen] Word count ${wordCount}, extending to 3000+...`);
    for (let i = 0; i < 8; i++) {
      const newCount = contentHtml.replace(/<[^>]*>/g, "").split(/\s+/).length;
      if (newCount >= 3000) break;
      const lastPara = contentHtml.match(/<p>[^<]*<\/p>\s*$/);
      const preview = lastPara ? `Akhir artikel:\n...${lastPara[0].slice(0, 200)}\n\nLANJUTKAN DARI SINI. WAJIB: tambah 1000+ KATA BARU:` : "Tulis konten baru 1000+ kata. WAJIB:";
      const continuePrompt = `Kamu penulis konten ahli. INI WAJIB: tulis MINIMAL 1000+ KATA BARU, jangan ulang konten sebelumnya.

STRUKTUR:
- <h2> judul → <p> isi → <h3> sub-bab → detail
- Minimal 2 <h2> baru
- Pakai <ul>, <ol>, <blockquote>, <table>
- JANGAN markdown, JANGAN <h1>

${preview}`;
      const moreContent = await callLLM(continuePrompt, 0.8, 8192);
      const cleanMore = moreContent.replace(/---+\s*METADATA\s*\n{[\s\S]*}/i, "").trim();
      if (cleanMore.length > 200) {
        contentHtml = contentHtml + "\n\n" + cleanMore;
        const newCount = contentHtml.replace(/<[^>]*>/g, "").split(/\s+/).length;
        console.log(`[blog-gen] Extended to ${newCount} words`);
        if (newCount >= 3000) break;
      }
    }
  }

  // Phase 2.8: SEO enrichment — internal links + schema + metadata
  const rawText = contentHtml.replace(/<[^>]*>/g, "").trim();
  const articleSlug = seoData.slug || topicData.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  // Internal links: fetch related published posts
  const { data: relatedPosts } = await supabase
    .from("blog_posts")
    .select("slug, title")
    .neq("slug", articleSlug)
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(3);
  if (relatedPosts && relatedPosts.length >= 2) {
    const relatedLinks = relatedPosts
      .slice(0, 2)
      .map((p: any) => `<li><a href="/blog/${p.slug}">${p.title}</a></li>`)
      .join("\n");
    contentHtml += `\n<h2>Baca Juga</h2>\n<ul>${relatedLinks}\n</ul>`;
  }

  // Schema JSON-LD
  const schemaJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: topicData.title,
    description: seoData.meta_description || rawText.slice(0, 160),
    author: { "@type": "Organization", name: "Kapster" },
    publisher: { "@type": "Organization", name: "Kapster", url: SITE_URL },
    datePublished: new Date().toISOString(),
    dateModified: new Date().toISOString(),
    mainEntityOfPage: { "@type": "WebPage", "@id": `${SITE_URL}/blog/${articleSlug}` },
    wordCount: rawText.split(/\s+/).length,
  };
  contentHtml += `\n<script type="application/ld+json">${JSON.stringify(schemaJsonLd)}</script>`;

  // SEO metadata via LLM
  if (topicData.title) {
    const metaPrompt = `Berdasarkan artikel berikut, buat SEO metadata dalam Bahasa Indonesia untuk blog barbershop.

Judul: "${topicData.title}"

${rawText.slice(0, 3000)}

Output JSON SAJA:
{"excerpt": "excerpt 150-200 karakter menggambarkan isi artikel", "meta_description": "meta description 150-160 karakter untuk SEO"}`
    try {
      const metaResponse = await callLLM(metaPrompt, 0.3, 500);
      const metaJson = JSON.parse(metaResponse.replace(/^```(?:json)?\s*|\s*```$/g, "").trim());
      if (metaJson.excerpt && metaJson.excerpt.length > 80) seoData.excerpt = metaJson.excerpt;
      if (metaJson.meta_description && metaJson.meta_description.length > 80) seoData.meta_description = metaJson.meta_description;
    } catch {
      // fallback to raw text truncation below
    }
  }

  // Phase 3: Save as Draft
  console.log("[blog-gen] Phase 3: Saving draft...");
  if (!seoData.excerpt || seoData.excerpt.length < 80) {
    seoData.excerpt = rawText.slice(0, 200).replace(/^["'\s]+|["'\s]+$/g, "");
  }
  if (!seoData.meta_description || seoData.meta_description.length < 80) {
    seoData.meta_description = rawText.slice(0, 160).replace(/^["'\s]+|["'\s]+$/g, "");
  }
  let slug = seoData.slug;
  if (!slug || slug.length < 3) {
    slug = topicData.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  }

  const { data: existingSlug } = await supabase
    .from("blog_posts")
    .select("slug")
    .eq("slug", slug)
    .maybeSingle();

  if (existingSlug) {
    const rand = Math.random().toString(36).slice(2, 6);
    slug = `${slug}-${rand}`;
  }

  const { data: draft, error: insertError } = await supabase.from("blog_posts").insert({
    title: topicData.title,
    slug,
    content_html: contentHtml,
    excerpt: seoData.excerpt || contentHtml.replace(/<[^>]*>/g, "").slice(0, 200),
    meta_description: seoData.meta_description || contentHtml.replace(/<[^>]*>/g, "").slice(0, 160),
    keywords: seoData.keywords || [],
    content_plan_id: planId,
    topics: seoData.topics || [],
    status: "draft",
  }).select("id").single();

  if (insertError) {
    console.error("[blog-gen] Failed to save draft:", insertError);
    throw insertError;
  }

  await recordMetric(supabase, "posts_created", 1, { type: "blog" });
  await checkQualityAlerts(supabase);
  console.log(`[blog-gen] Draft saved: /blog/${slug} (id: ${draft.id})`);

  // Phase 4: Generate Image
  console.log("[blog-gen] Phase 4: Image generation...");
  let ogImageUrl = "";
  if (PUTER_AUTH_TOKEN) {
    try {
      const { init } = await import("@heyputer/puter.js/src/init.cjs");
      const puter = init(PUTER_AUTH_TOKEN);
      const imgPrompt = `Professional blog thumbnail for Indonesia barbershop industry. Topic: "${topicData.title}". Clean flat-design illustration with warm gold and dark navy scheme. Modern barbershop scene. No text overlay. Minimalist. Warm lighting. Premium feel.`;
      const img = await puter.ai.txt2img(imgPrompt, { model: "gpt-image-1-mini", quality: "medium" });
      const base64Data = img.src.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");
      const fileName = `blog/${draft.id}/${slug}.png`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("cover-images")
        .upload(fileName, buffer, { contentType: "image/png", upsert: true });
      if (!uploadError && uploadData) {
        const { data: publicUrl } = supabase.storage.from("cover-images").getPublicUrl(fileName);
        ogImageUrl = publicUrl.publicUrl;
        await supabase.from("blog_posts").update({ og_image_url: ogImageUrl }).eq("id", draft.id);
        console.log(`[blog-gen] Image: ${ogImageUrl}`);
      } else {
        console.error("[blog-gen] Upload failed:", uploadError);
      }
    } catch (err) {
      console.error("[blog-gen] Image generation failed:", err);
    }
  }

  // Phase 5: Telegram Notification
  console.log("[blog-gen] Phase 5: Telegram...");
  const previewText = `<b>${topicData.title}</b>

📝 ${seoData.excerpt?.slice(0, 300) || ""}

🏷 Keywords: ${(seoData.keywords || []).join(", ")}
📐 Panjang: ~${contentHtml.length} karakter
⭐ SEO Score: ${seoData.seo_score || "N/A"}

<em>Review dan pilih aksi di bawah:</em>`;

  const msgId = await sendTelegramInlineKeyboard(previewText, [
    [
      { text: "✅ Post", callback_data: `blog_post:${draft.id}` },
      { text: "❌ Cancel", callback_data: `blog_cancel:${draft.id}` },
    ],
  ]);

  await supabase.from("blog_posts").update({ telegram_msg_id: msgId }).eq("id", draft.id);

  console.log("[blog-gen] Done!");
}

async function researchPhase(supabase: any): Promise<ResearchResult | null> {
  // 1a: Fetch existing posts
  const { data: existingPosts } = await supabase
    .from("blog_posts")
    .select("title, slug")
    .order("created_at", { ascending: false });
  const existingTitles = (existingPosts ?? []).map((p: { title: string }) => p.title);

  // 1b: GSC keyword gap analysis
  let gscData = "";
  if (process.env.GSC_CLIENT_EMAIL && process.env.GSC_PRIVATE_KEY) {
    try {
      gscData = await fetchGSCKeywordGaps();
    } catch (err) {
      console.warn("[blog-gen] GSC fetch failed, skipping:", err);
    }
  }

  // 1c: Trend-Pulse
  let trendData = "";
  try {
    trendData = await runTrendPulse();
  } catch (err) {
    console.warn("[blog-gen] Trend-Pulse failed, skipping:", err);
  }

  // 1d: LLM topic selection
  const topicPrompt = `Kamu adalah asisten riset konten untuk blog kapster.my.id, platform manajemen antrian barbershop Indonesia.

TUGAS: Pilih SATU topik artikel blog yang PALING STRATEGIS untuk SEO dan engagement.

DATA GSC (keyword gaps — posisi 11-20 dengan impressions tinggi):
${gscData || "(Tidak ada data GSC)"}

TREND TERKINI:
${trendData || "(Tidak ada data trend)"}

JUDUL YANG SUDAH DIBUAT:
${existingTitles.join(", ") || "(belum ada)"}

Aturan topik:
1. Prioritaskan keyword dari GSC keyword gaps jika ada — itu bukti orang sudah mencari topik tersebut.
2. JANGAN pilih judul generik dengan kata "optimalkan", "maksimalkan", "tingkatkan", "tips", "cara mudah", "panduan lengkap". Pilih judul spesifik yang menjawab pertanyaan nyata.
3. Bisa radius dari barbershop. Contoh: "Cara Hitung Kebutuhan Staf Barbershop per Shift" lebih spesifik dari "Optimalkan Staf Barbershop".
4. Pertimbangkan tambahkan sinyal SEO untuk varian ejaan: "kapaster" sebagai alternatif pencarian dari "kapster".
5. Layak artikel MENDALAM (3000+ kata) dengan contoh dan data konkret.
6. Natural mengarah ke CTA Kapster.

Beri output JSON SAJA (tanpa markdown formatting):
{"topic": "nama topik singkat", "title": "judul artikel max 60 karakter (spesifik, bukan generik)", "reasoning": "mengapa topik ini dipilih (kaitkan ke SEO dan data GSC)", "seo_keywords": ["kw1", "kw2", "kw3", "kapaster"]}`;

  const topicResponse = await callLLM(topicPrompt, 0.7, 500);
  let topicData: { topic: string; title: string; reasoning: string; seo_keywords: string[] };
  try {
    topicData = JSON.parse(topicResponse.trim());
  } catch {
    console.error("[blog-gen] Failed to parse topic:", topicResponse);
    await recordMetric(supabase, "research_failed", 1, { reason: "llm_parse" });
    return null;
  }

  // 1e: MCP web search
  let webResearchData = "";
  const searchResults = await callMCPTool("web_search", {
    query: `${topicData.topic} ${topicData.seo_keywords?.filter(Boolean).slice(0, 2).join(" ")} Indonesia 2026`,
    num_results: 6,
  });

  if (searchResults && Array.isArray(searchResults) && searchResults.length > 0) {
    const results = searchResults as Array<{ title: string; url: string; snippet: string }>;
    webResearchData = results.slice(0, 4).map((r) => `Title: ${r.title}\nURL: ${r.url}\nSnippet: ${r.snippet}`).join("\n\n");

    for (const result of results.slice(0, 2)) {
      const content = await callMCPTool("fetch_page", { url: result.url });
      if (content) {
        webResearchData += `\n\n=== ${result.url} ===\n${content}`;
      }
    }
  }

  // 1f: Save to content_plans
  const brief = `Topik: ${topicData.topic}
Judul: ${topicData.title}
Keywords: ${(topicData.seo_keywords || []).join(", ")}
GSC: ${gscData ? "Ada" : "Tidak ada"}
Trend: ${trendData ? "Ada" : "Tidak ada"}

Web Research:
${webResearchData || "(Tidak ada)"}

Alasan: ${topicData.reasoning}`;

  const { data: plan, error: planError } = await supabase.from("content_plans").insert({
    brief,
    status: "pending",
  }).select("id").single();

  if (planError) {
    console.error("[blog-gen] Failed to save plan:", planError);
    await recordMetric(supabase, "research_failed", 1, { reason: "db_error" });
    return null;
  }

  await recordMetric(supabase, "plans_created", 1, { source: gscData ? "gsc" : "trend" });
  await recordMetric(supabase, "research_success", 1, {});

  return { topicData, webResearchData, planId: plan.id, brief };
}

async function fetchGSCKeywordGaps(): Promise<string> {
  const { GoogleAuth } = await import("google-auth-library");
  const auth = new GoogleAuth({
    credentials: {
      client_email: process.env.GSC_CLIENT_EMAIL!,
      private_key: process.env.GSC_PRIVATE_KEY!.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/webmasters.readonly"],
  });
  const client = await auth.getClient();
  const siteUrl = process.env.GSC_SITE_URL || "sc-domain:kapster.my.id";
  const endDate = new Date().toISOString().split("T")[0];
  const startDate = new Date(Date.now() - 90 * 86400000).toISOString().split("T")[0];

  const res = await client.request({
    url: `https://searchconsole.googleapis.com/v1/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
    method: "POST",
    data: {
      startDate,
      endDate,
      dimensions: ["query"],
      rowLimit: 200,
      orderBy: [{ metricName: "impressions", sortOrder: "DESCENDING" }],
    },
  });

  const rows = (res.data as any).rows || [];
  const gaps = rows
    .filter((r: any) => {
      const pos = r.position || 100;
      return pos >= 11 && pos <= 20 && r.impressions > 100;
    })
    .map((r: any) => `"${r.keys[0]}" → ${r.impressions} impressions, pos ${Math.round(r.position * 10) / 10}, ${r.clicks} clicks`)
    .slice(0, 30);

  return gaps.length ? gaps.join("\n") : "Tidak ada keyword gap signifikan";
}

async function runTrendPulse(): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(TREND_PULSE_PATH, [
      "barbershop Indonesia",
      "gaya rambut trend",
      "perawatan rambut pria",
    ], {
      stdio: ["ignore", "pipe", "pipe"],
    });
    let output = "";
    child.stdout.on("data", (d: Buffer) => { output += d.toString(); });
    child.on("close", (code) => {
      if (code !== 0) reject(new Error(`Trend-Pulse exited with code ${code}`));
      const lines = output.trim().split("\n").slice(0, 15);
      resolve(lines.join("\n"));
    });
    child.on("error", (err) => reject(err));
    setTimeout(() => { child.kill(); reject(new Error("Trend-Pulse timeout")); }, 25000);
  });
}

async function reviewBlogContent(html: string, title: string): Promise<{ score: number; notes: string }> {
  const fullText = html.replace(/<[^>]*>/g, "").slice(0, 15000);
  const h2Count = (html.match(/<h2/g) || []).length;
  const prompt = `Kamu adalah QA reviewer konten blog. Review artikel berikut dan beri score 1-5.

KRITERIA PENILAIAN:
1. Konten depth (2 points): Apakah artikel benar-benar menjawab judul "${title}" dengan contoh nyata, data, atau studi kasus? Atau cuma saran generik?
2. Struktur konten (1 point): Minimal 3 <h2> substantive. Apakah alur logis dan informatif?
3. No fake claims (1 point): Apakah ada klaim tanpa data atau testimoni palsu?
4. Tone natural (1 point): Apakah mengalir kayak majalah? Atau kaku kayak buku teks?

DATA: Artikel memiliki ${h2Count} sub-bab (<h2>).

FORMAT RESPON (JSON SAJA, tanpa markdown):
{"score": 4, "notes": "Penjelasan spesifik apa yang perlu diperbaiki"}

ARTIKEL:
${fullText}`;

  const apis = ["openrouter", "groq"] as const;
  for (const api of apis) {
    try {
      const raw = api === "openrouter"
        ? await askOpenRouter(prompt, { temperature: 0.3, max_tokens: 300 })
        : await callGroq(prompt, 0.3, 300);
      const cleaned = raw.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "").trim();
      const result = JSON.parse(cleaned);
      return { score: Math.max(1, Math.min(5, result.score || 3)), notes: result.notes || "" };
    } catch {
      if (api === "openrouter") console.warn("[blog-gen] OpenRouter QA failed, falling back to Groq...");
    }
  }
  return { score: 5, notes: "QA unavailable (both providers failed)" };
}

async function callGroq(prompt: string, temperature = 0.7, maxTokens = 4096) {
  const models = [
    "llama-3.3-70b-versatile",
    "meta-llama/llama-4-scout-17b-16e-instruct",
    "qwen/qwen3-32b",
  ];
  // Smaller models for small prompts only
  if (prompt.length < 2000) models.push("llama-3.1-8b-instant");
  for (const model of models) {
    try {
      return await callGroqModel(model, prompt, temperature, maxTokens);
    } catch (err: any) {
      if (err.message.includes("rate limit") || err.message.includes("429")) {
        console.warn(`[blog-gen] Groq ${model} rate limited, trying next model...`);
        continue;
      }
      throw err;
    }
  }
  throw new Error("All Groq models rate limited or failed");
}

async function callGroqModel(model: string, prompt: string, temperature = 0.7, maxTokens = 4096) {
  if (!GROQ_API_KEY) throw new Error("GROQ_API_KEY not set");

  const res = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${GROQ_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: "Kamu adalah asisten konten Kapster. Jawab dalam Bahasa Indonesia. Output informatif dan mendalam." },
        { role: "user", content: prompt },
      ],
      max_tokens: maxTokens,
      temperature,
    }),
    signal: AbortSignal.timeout(120000),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    if (res.status === 429) throw new Error(`Groq rate limited (${model}): ${errText}`);
    throw new Error(`Groq API error ${res.status} (${model}): ${errText}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

export async function callLLM(prompt: string, temperature = 0.7, maxTokens = 4096): Promise<string> {
  const providers: { name: string; call: () => Promise<string> }[] = [
    { name: "groq", call: () => callGroq(prompt, temperature, maxTokens) },
  ];
  const openrouterKey = process.env.OPENROUTER_API_KEY;
  if (openrouterKey) {
    const orModels = [
      "openai/gpt-oss-120b:free",
      "google/gemma-2-9b-it:free",
      "meta-llama/llama-3.2-11b-vision-instruct:free",
    ];
    providers.push({
      name: "openrouter",
      call: async () => {
        for (const model of orModels) {
          try {
            return await askOpenRouter(prompt, { temperature, max_tokens: maxTokens, model });
          } catch (err: any) {
            console.warn(`[blog-gen] OpenRouter ${model} failed: ${err.message}`);
          }
        }
        throw new Error("All OpenRouter models failed");
      },
    });
  }
  const ollamaKey = process.env.OLLAMA_API_KEY;
  if (ollamaKey) {
    providers.push({
      name: "ollama",
      call: () => askOllamaWithSystem(prompt, "Kamu adalah asisten konten Kapster. Jawab dalam Bahasa Indonesia. Output informatif dan mendalam.", { temperature, max_tokens: maxTokens }),
    });
  }
  for (const p of providers) {
    try {
      const result = await p.call();
      if (result) return result;
    } catch (err: any) {
      console.warn(`[blog-gen] ${p.name} failed: ${err.message}`);
    }
  }
  throw new Error(`All LLM providers failed`);
}

async function callMCPTool(toolName: string, args: Record<string, unknown>) {
  return new Promise((resolve) => {
    const child = spawn("node", [MCP_SERVER_PATH], { stdio: ["pipe", "pipe", "pipe"] });
    let output = "";
    let errorOutput = "";

    child.stdout.on("data", (data: Buffer) => { output += data.toString(); });
    child.stderr.on("data", (data: Buffer) => { errorOutput += data.toString(); });

    child.on("close", (code) => {
      if (code !== 0) {
        console.warn(`[MCP] ${toolName} exit code ${code}: ${errorOutput}`);
        resolve(null);
        return;
      }

      const lines = output.trim().split("\n");
      for (const line of lines) {
        try {
          const parsed = JSON.parse(line);
          if (parsed.result?.content) {
            const textContent = parsed.result.content.find((c: { type: string }) => c.type === "text");
            if (textContent) {
              resolve(JSON.parse(textContent.text));
              return;
            }
          }
        } catch {
          continue;
        }
      }
      resolve(null);
    });

    const send = (msg: Record<string, unknown>) => child.stdin.write(JSON.stringify(msg) + "\n");

    send({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "0.1.0", capabilities: {}, clientInfo: { name: "kapster-blog-gen", version: "1.0.0" } } });
    send({ jsonrpc: "2.0", id: 2, method: "notifications/initialized" });

    setTimeout(() => {
      send({ jsonrpc: "2.0", id: 3, method: "tools/call", params: { name: toolName, arguments: args } });
      setTimeout(() => child.stdin.end(), 5000);
    }, 1000);

    setTimeout(() => { child.kill(); resolve(null); }, 30000);
  });
}

main().catch((err) => {
  console.error("[blog-gen] Fatal:", err);
  process.exit(1);
});

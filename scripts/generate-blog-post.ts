import { createAdminClient } from "@/lib/supabase/admin";
import { sendTelegramInlineKeyboard } from "@/lib/telegram";
import { recordMetric, checkQualityAlerts } from "@/lib/metrics";
import { askOpenRouter } from "@/lib/ollama";
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

TUGAS: Tulis artikel BLOG SANGAT MENDALAM (3000-5000 kata) dalam Bahasa Indonesia.

Judul: "${topicData.title}"

Target pembaca: pemilik barbershop, barberman, dan pria Indonesia yang peduli penampilan.
Gaya: Seperti tulisan MAJALAH — natural, engaging, kadang ada celotehan atau humor ringan. BUKAN kaku seperti buku teks.

PANDUAN STRUKTUR:

1. Pendahuluan (200-300 kata) — Variatif tiap artikel:
   - Bisa hook, data statistik, pertanyaan retoris, analogi, kutipan, atau cerita pendek
   - JANGAN mulai dengan "Dalam era digital..." atau "Di Indonesia..."

2. 5-7 sub-bab (masing-masing 300-600 kata):
   - JANGAN semua sub-bab dimulai dengan <p>
   - Setiap sub-bab harus punya kalimat transisi dari sub-bab sebelumnya
   - Variasi panjang: ada yang pendek (200), ada yang panjang (600)
   - JANGAN gunakan pola tag berulang — variasi tiap section

3. Kesimpulan (150-200 kata) — JANGAN "Kesimpulan" sebagai heading. Pakai <h2> yang engaging

4. CTA di akhir:
<p>Kalau kamu ingin fokus mengembangkan bisnis barbershop tanpa pusing urus antrian, coba deh pakai Kapster. Sistem antrian digital yang bikin pelanggan puas dan operasional makin rapi. Cuma Rp10.000/bulan. Mulai gratis di ${SITE_URL}!</p>

ATURAN FORMAT WAJIB:
- Setiap artikel WAJIB memiliki MINIMAL: 1 <ul>, 1 <ol>, 1 <blockquote>, 1 <table>
- Dua sub-bab berturut-turut TIDAK BOLEH punya pola tag pertama sama
- Gunakan <strong> untuk kata kunci (min 5)
- Gunakan <em> untuk istilah asing (min 2)
- <table> untuk perbandingan atau data (min 1 jika relevan)
- Jika topik cocok, pakai satu sub-bab dengan struktur Q&A

CONTOH VARIASI POLA (bukan daftar harus, tapi inspirasi):
Section 1: <h2> → <blockquote> → <p> → <strong> → <p> → <p> → <ul>
Section 2: <h2> → <p> → <h3> → <p> → <h3> → <p> → <ol>
Section 3: <h2> → <p> → <table> → <p> → <ol>
Section 4: <h2> → <p> → <blockquote> → <p> → <ul>
Section 5: <h2> → <p> → <h3> → <p> → <ol> → <h3> → <blockquote>

FORMAT OUTPUT: HTML murni. Hanya tag: h2, h3, p, strong, em, ul, ol, li, blockquote, table, thead, tbody, tr, th, td, a. JANGAN markdown. JANGAN <h1>.

SETELAH artikel, di baris terakhir:
---METADATA
{"excerpt": "ringkasan 150-200 karakter", "meta_description": "meta 150-160 karakter", "slug": "url-slug", "keywords": ["kw1","kw2","kw3","kw4","kw5"], "topics": ["topik1"], "seo_score": 85}`;

  const fullResponse = await callGroq(contentPrompt, 0.8, 8192);

  // Split article and metadata
  const metaSplit = fullResponse.split("---METADATA");
  let contentHtml = metaSplit[0]?.trim() || fullResponse;
  let seoData: any;
  try {
    seoData = JSON.parse(metaSplit[1]?.trim() || "{}");
  } catch {
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
    const fixedResponse = await callGroq(fixedPrompt, 0.8, 8192);
    const fixedMetaSplit = fixedResponse.split("---METADATA");
    const fixedContent = fixedMetaSplit[0]?.trim() || fixedResponse;
    let fixedSeo: any;
    try { fixedSeo = JSON.parse(fixedMetaSplit[1]?.trim() || "{}"); } catch { fixedSeo = seoData; }
    contentHtml = fixedContent;
    seoData = fixedSeo;
    console.log(`[blog-gen] Regenerated: ${contentHtml.length} chars`);
    await recordMetric(supabase, "qa_regen_rate", 1, { title: topicData.title });
  }

  // Phase 3: Save as Draft
  console.log("[blog-gen] Phase 3: Saving draft...");
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
    slug = `${slug}-${Date.now().toString(36)}`;
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
1. Bisa radius dari barbershop (tidak harus langsung). Contoh: "Sejarah Kursi" → dikaitkan ke kursi barbershop, "Psikologi Gaya Rambut" → self-esteem → Kapster
2. Belum pernah dibahas
3. Punya celah SEO (GSC gaps prioritas)
4. Natural mengarah ke CTA Kapster
5. Layak artikel MENDALAM (3000+ kata)

Beri output JSON SAJA (tanpa markdown formatting):
{"topic": "nama topik singkat", "title": "judul artikel max 60 karakter", "reasoning": "mengapa topik ini dipilih (kaitkan ke SEO)", "seo_keywords": ["kw1", "kw2", "kw3"]}`;

  const topicResponse = await callGroq(topicPrompt, 0.7, 500);
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
  const text = html.replace(/<[^>]*>/g, "").slice(0, 3000);
  const prompt = `Kamu adalah QA reviewer konten blog. Review artikel berikut dan beri score 1-5.

KRITERIA PENILAIAN:
1. Hook spesifik (2 points): Apakah pendahuluan engaging, bukan generik?
2. Format variety (1 point): Apakah ada bullet list, numbering, tabel, blockquote?
3. No fake claims (1 point): Apakah ada klaim tanpa data?
4. Tone natural (1 point): Apakah mengalir kayak majalah? Atau kaku kayak buku teks?

FORMAT RESPON (JSON SAJA, tanpa markdown):
{"score": 4, "notes": "Pendahuluan hook bagus tapi kurang variasi tabel"}

ARTIKEL:
${text}`;

  const apis = ["openrouter", "groq"] as const;
  for (const api of apis) {
    try {
      const raw = api === "openrouter"
        ? await askOpenRouter(prompt, { temperature: 0.3, max_tokens: 300 })
        : await callGroq(prompt, 0.3, 300);
      const cleaned = raw.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "").trim();
      const result = JSON.parse(cleaned);
      return { score: Math.max(1, Math.min(5, result.score)), notes: result.notes || "" };
    } catch {
      if (api === "openrouter") console.warn("[blog-gen] OpenRouter QA failed, falling back to Groq...");
    }
  }
  return { score: 3, notes: "QA gagal (both providers)" };
}

async function callGroq(prompt: string, temperature = 0.7, maxTokens = 4096) {
  if (!GROQ_API_KEY) throw new Error("GROQ_API_KEY not set");

  const res = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${GROQ_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: GROQ_MODEL,
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
    throw new Error(`Groq API error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
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

import { createAdminClient } from "@/lib/supabase/admin";
import { sendTelegramInlineKeyboard } from "@/lib/telegram";
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

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

async function main() {
  console.log(`[blog-gen] Starting at ${new Date().toISOString()}`);

  const supabase = await createAdminClient();

  // Phase 1: Research
  console.log("[blog-gen] Phase 1: Research...");
  const { data: existingPosts } = await supabase
    .from("blog_posts")
    .select("title, excerpt, topics, keywords, meta_description")
    .order("created_at", { ascending: false });

  const existingTitles = (existingPosts ?? []).map((p: { title: string }) => p.title);

  const searchResults = await callMCPTool("web_search", {
    query: "trend gaya rambut barbershop Indonesia 2026 tips perawatan",
    num_results: 8,
  });

  let webResearchData = "";
  if (searchResults && Array.isArray(searchResults) && searchResults.length > 0) {
    webResearchData = (searchResults as SearchResult[])
      .slice(0, 5)
      .map((r) => `Title: ${r.title}\nURL: ${r.url}\nSnippet: ${r.snippet}`)
      .join("\n\n");

    for (const result of (searchResults as SearchResult[]).slice(0, 2)) {
      const content = await callMCPTool("fetch_page", { url: result.url });
      if (content) {
        webResearchData += `\n\n=== Full content from: ${result.url} ===\n${content}`;
      }
    }
  }

  // Phase 2: Topic Selection
  console.log("[blog-gen] Phase 2: Topic Selection...");
  const topicPrompt = `Kamu adalah asisten riset konten untuk blog kapster.my.id, platform manajemen antrian barbershop Indonesia.

TUGAS: Pilih SATU topik artikel yang paling menarik dan potensial untuk SEO.

Topik harus:
1. Terkait industri barbershop (gaya rambut, perawatan, bisnis, tips, lifestyle)
2. Belum pernah dibahas
3. Punya potensi SEO bagus
4. Bisa secara natural dikaitkan dengan CTA ke Kapster di akhir
5. Layak untuk artikel SANGAT MENDALAM (3000+ kata)

Topik yang SUDAH dibahas: ${existingTitles.join(", ") || "(belum ada)"}

Hasil riset web:
${webResearchData}

Beri output JSON SAJA (tanpa markdown formatting):
{"topic": "nama topik", "title": "judul artikel max 60 karakter", "reasoning": "penjelasan singkat", "seo_keywords": ["keyword1", "keyword2", "keyword3"]}`;

  const topicResponse = await callGroq(topicPrompt, 0.7, 500);
  let topicData: { topic: string; title: string; reasoning: string; seo_keywords: string[] };
  try {
    topicData = JSON.parse(topicResponse.trim());
  } catch {
    console.error("[blog-gen] Failed to parse topic response:", topicResponse);
    throw new Error("Topic selection failed");
  }

  console.log(`[blog-gen] Topic: ${topicData.title}`);

  // Phase 3: Content Generation + SEO Metadata (merged to save API calls)
  console.log("[blog-gen] Phase 3: Generating article...");
  const contentPrompt = `Kamu adalah penulis konten ahli untuk blog kapster.my.id — platform manajemen antrian digital untuk barbershop Indonesia.

TUGAS: Tulis artikel BLOG SANGAT MENDALAM (3000-5000 kata) dalam Bahasa Indonesia.

Judul: "${topicData.title}"

Target pembaca: pemilik barbershop, barberman, dan pecinta barber di Indonesia.
Gaya: informatif, otoritatif, ramah, mengalir alami seperti tulisan majalah — BUKAN kaku seperti buku teks.

PANDUAN STRUKTUR & FORMAT (WAJIB):
1. JANGAN gunakan <h1> — langsung mulai dengan pendahuluan (<p>)
2. Gunakan <h2> untuk sub-bab utama (5-7 sub-bab)
3. Gunakan <h3> untuk sub-topik di dalam sub-bab (minimal 2-3 artikel)
4. Pendahuluan (200-300 kata) yang engaging — bisa pakai hook, pertanyaan retoris, atau data menarik
5. Setiap sub-bab 400-700 kata dengan data, tips, contoh konkret
6. Kesimpulan (150-200 kata)
7. CTA ke Kapster di akhir: <p>Kalau kamu ingin fokus mengembangkan bisnis barbershop tanpa pusing urus antrian, coba deh pakai Kapster. Sistem antrian digital yang bikin pelanggan puas dan operasional makin rapi. Cuma Rp10.000/bulan. Mulai gratis di ${SITE_URL}!</p>

ATURAN FORMAT KONTEN (WAJIB):
- JANGAN gunakan pola berulang (h2→p→ul→p) di setiap section. Variasikan struktur setiap sub-bab.
- Gunakan <strong> untuk kata kunci atau poin penting (minimal 5 kali)
- Gunakan <em> untuk penekanan atau istilah asing (minimal 3 kali)
- Gunakan <blockquote> untuk quotes, studi kasus, atau data penting (minimal 1 kali)
- Gunakan tabel <table><thead><tbody> untuk perbandingan, data, atau daftar fitur (jika relevan)
- Gunakan <ul> dan <ol> untuk daftar, tips, dan langkah-langkah
- Bervariasi: ada yang dimulai dengan kutipan, ada yang dengan data statistik, ada yang dengan analogi
- Jika relevan, tambahkan tautan internal: <a href="${SITE_URL}/blog">Blog Kapster</a>

CONTOH VARIASI POLA (bukan harus persis, tapi sebagai inspirasi):
- <h2> → <blockquote> → <p> → <p> → <ul>
- <h2> → <p> → <h3> → <p> → <h3> → <p> → <ul>
- <h2> → <p> → <table> → <p>
- <h2> → <p> → <strong> → <p> → <blockquote>

FORMAT OUTPUT: HTML murni (tanpa html/body/head). Hanya tag yang disebutkan di atas. JANGAN markdown.

SETELAH artikel, di baris terakhir beri metadata JSON:
---METADATA
{"excerpt": "ringkasan 150-200 karakter", "meta_description": "meta description 150-160 karakter", "slug": "url-slug-dari-judul", "keywords": ["kw1","kw2","kw3","kw4","kw5"], "topics": ["topik1","topik2"], "seo_score": 85}`;

  const fullResponse = await callGroq(contentPrompt, 0.8, 8192);

  // Split article and metadata
  const metaSplit = fullResponse.split("---METADATA");
  const contentHtml = metaSplit[0]?.trim() || fullResponse;
  let seoData: { excerpt: string; meta_description: string; slug: string; keywords: string[]; topics: string[]; seo_score: number };
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

  // Phase 4: Save as Draft
  console.log("[blog-gen] Phase 4: Saving draft...");
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
    topics: seoData.topics || [],
    status: "draft",
  }).select("id").single();

  if (insertError) {
    console.error("[blog-gen] Failed to save draft:", insertError);
    throw insertError;
  }

  console.log(`[blog-gen] Draft saved: /blog/${slug} (id: ${draft.id})`);

  // Phase 5: Generate Image
  console.log("[blog-gen] Phase 5: Image generation...");
  let ogImageUrl = "";
  if (PUTER_AUTH_TOKEN) {
    try {
      const { init } = await import("@heyputer/puter.js/src/init.cjs");
      const puter = init(PUTER_AUTH_TOKEN);
      const imgPrompt = `Professional blog thumbnail for "barbershop" industry in Indonesia. Topic: "${topicData.title}". Clean flat-design illustration style with warm gold and dark navy color scheme. A modern barbershop scene with barber tools (scissors, comb, razor) and digital elements subtly integrated. Professional Indonesian barber atmosphere. No text overlay. No people faces. Minimalist composition with strong focal point. Warm lighting, premium feel. Suitable for social media sharing card.`;
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

  // Phase 6: Telegram Notification
  console.log("[blog-gen] Phase 6: Telegram...");
  const previewText = `<b>${topicData.title}</b>

📝 ${seoData.excerpt.slice(0, 300)}

🏷 Keywords: ${seoData.keywords.join(", ")}
📐 Panjang: ~${contentHtml.length} karakter
⭐ SEO Score: ${seoData.seo_score || "N/A"}

<em>Review dan pilih aksi di bawah:</em>`;

  const msgId = await sendTelegramInlineKeyboard(previewText, [
    [
      { text: "✅ Post", callback_data: `blog_post:${draft.id}` },
      { text: "❌ Cancel", callback_data: `blog_cancel:${draft.id}` },
    ],
  ]);

  // Update draft with telegram message id
  await supabase.from("blog_posts").update({ telegram_msg_id: msgId }).eq("id", draft.id);

  console.log("[blog-gen] Done!");
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

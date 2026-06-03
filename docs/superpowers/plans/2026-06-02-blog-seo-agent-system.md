# Blog + SEO Agent System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade blog content generation with data-driven research + varied formatting + QA, and build periodic SEO audit agent with Telegram notifications.

**Architecture:** Two independent agents sharing infrastructure. Blog Agent runs daily (GSC gaps → Trend-Pulse → MCP research → varied content → QA → draft). SEO Audit Agent runs weekly (sitemap discovery → per-page HTML/PSI/GSC audit → LLM analysis → score tracking → Telegram alert).

**Tech Stack:** Groq (content gen), OpenRouter (QA), Trend-Pulse (trend), Google PageSpeed API (perf), Google Search Console API via Service Account (rankings), Supabase (storage), Telegram (notifications)

---

### Task 1: Migration — Add `content_plan_id` to `blog_posts`

**Files:**
- Create: `supabase/migrations/add_content_plan_id_to_blog_posts.sql`
- Modify: `lib/supabase/types.ts` (add `content_plan_id` to blog_posts Row/Insert/Update)

- [ ] **Step 1: Write migration SQL**

```sql
-- supabase/migrations/add_content_plan_id_to_blog_posts.sql
ALTER TABLE blog_posts
ADD COLUMN content_plan_id UUID REFERENCES content_plans(id) ON DELETE SET NULL;

-- Index for FK lookups
CREATE INDEX idx_blog_posts_content_plan_id ON blog_posts(content_plan_id);
```

- [ ] **Step 2: Update `lib/supabase/types.ts`**

Add `content_plan_id: string | null` to `blog_posts.Row`, `Insert`, and `Update` types (around line 675). Place it after `keywords`:

```typescript
blog_posts: {
  Row: {
    id: string
    title: string
    slug: string
    content_html: string
    excerpt: string
    meta_description: string
    keywords: string[]
    content_plan_id: string | null
    og_image_url: string | null
    topics: string[]
    status: "draft" | "published" | "cancelled"
    telegram_msg_id: number | null
    published_at: string | null
    created_at: string
    updated_at: string
  }
  // ... same for Insert and Update
}
```

- [ ] **Step 3: Run migration on staging**

Run: `psql $DATABASE_URL -f supabase/migrations/add_content_plan_id_to_blog_posts.sql`

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/add_content_plan_id_to_blog_posts.sql lib/supabase/types.ts
git commit -m "feat: add content_plan_id to blog_posts for plan tracking"
```

---

### Task 2: Extract `recordMetric` and `checkQualityAlerts` to Shared Lib

**Files:**
- Create: `lib/metrics.ts`
- Modify: `scripts/generate-social-content.ts` (import from lib instead of inline)

- [ ] **Step 1: Create `lib/metrics.ts`**

```typescript
import { logError } from "@/lib/error-logger";
import { sendTelegramMessage } from "@/lib/telegram";

export async function recordMetric(
  supabase: any,
  metricName: string,
  metricValue: number,
  metadata?: Record<string, unknown>,
) {
  const metricDate = new Date().toISOString().split("T")[0];
  const { error } = await supabase.from("content_metrics").insert({
    metric_date: metricDate,
    metric_name: metricName,
    metric_value: metricValue,
    metadata: metadata ?? {},
  });
  if (error) logError("recordMetric", error, { metricName, metricValue });
}

export async function checkQualityAlerts(supabase: any) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const dateStr = thirtyDaysAgo.toISOString().split("T")[0];

  const { data: recentMetrics } = await supabase
    .from("content_metrics")
    .select("metric_date, metric_value, metadata")
    .eq("metric_name", "template_ratio")
    .gte("metric_date", dateStr)
    .order("metric_date", { ascending: false })
    .limit(30);

  if (recentMetrics && recentMetrics.length >= 5) {
    const highTemplateRatio = recentMetrics.filter(
      (m: { metric_value: number }) => m.metric_value > 20,
    ).length;
    const ratio = highTemplateRatio / recentMetrics.length;
    if (ratio > 0.2) {
      await sendTelegramMessage(
        `⚠️ *Content Quality Alert*\n\nTemplate ratio >20% dalam ${highTemplateRatio}/${recentMetrics.length} hari terakhir.\nPeriksa prompt riset atau variasi topik.`,
      );
    }
  }

  const { data: qaScores } = await supabase
    .from("content_metrics")
    .select("metric_date, metric_value")
    .eq("metric_name", "qa_avg_score")
    .order("metric_date", { ascending: false })
    .limit(3);

  if (qaScores && qaScores.length >= 3) {
    const lowScoreDays = qaScores.filter(
      (m: { metric_value: number }) => m.metric_value < 4,
    ).length;
    if (lowScoreDays >= 3) {
      await sendTelegramMessage(
        `⚠️ *Content Quality Alert*\n\nQA score < 4 selama ${lowScoreDays} hari berturut-turut.\nPeriksa prompt riset atau kualitas brief.`,
      );
    }
  }
}
```

- [ ] **Step 2: Replace inline functions in `scripts/generate-social-content.ts`**

Delete lines 418-478 (inline `recordMetric` and `checkQualityAlerts` functions). Add import at top:

```typescript
import { recordMetric, checkQualityAlerts } from "@/lib/metrics";
```

- [ ] **Step 3: Verify social media still compiles**

Run: `npx tsx --no-warnings scripts/generate-social-content.ts --mode=research --platform=ig --topic=test 2>&1 | head -20`
Expected: Should not error on import.

- [ ] **Step 4: Commit**

```bash
git add lib/metrics.ts scripts/generate-social-content.ts
git commit -m "refactor: extract recordMetric and checkQualityAlerts to lib/metrics.ts"
```

---

### Task 3: Rewrite Blog Research Pipeline (GSC + Trend-Pulse + MCP)

**Files:**
- Modify: `scripts/generate-blog-post.ts` (replace Phase 1-2 entirely)
- Modify: `app/api/cron/generate-blog/route.ts` (pass GSC env to child process)

- [ ] **Step 1: Install GSC API dependency**

Run: `npm install google-auth-library`

- [ ] **Step 2: Update imports in `scripts/generate-blog-post.ts`**

Replace existing imports with:

```typescript
import { createAdminClient } from "@/lib/supabase/admin";
import { sendTelegramInlineKeyboard } from "@/lib/telegram";
import { recordMetric } from "@/lib/metrics";
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
```

- [ ] **Step 3: Replace Phase 1 (Research) with GSC + Trend-Pulse + MCP**

Delete the old research phase (lines 30-56). Replace with:

```typescript
async function researchPhase(supabase: any) {
  console.log("[blog-gen] Phase 1: Research...");

  // 1a: Fetch existing posts for dedup
  const { data: existingPosts } = await supabase
    .from("blog_posts")
    .select("title, slug")
    .order("created_at", { ascending: false });
  const existingTitles = (existingPosts ?? []).map((p: { title: string }) => p.title);

  // 1b: GSC keyword gap analysis (if configured)
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

  console.log(`[blog-gen] Topic: ${topicData.title} (${topicData.reasoning})`);

  // 1e: MCP web search for deep dive
  let webResearchData = "";
  const searchResults = await callMCPTool("web_search", {
    query: `${topicData.topic} ${topicData.seo_keywords?.slice(0, 2).join(" ")} Indonesia 2026`,
    num_results: 6,
  });

  if (searchResults && Array.isArray(searchResults) && searchResults.length > 0) {
    webResearchData = (searchResults as Array<{ title: string; url: string; snippet: string }>)
      .slice(0, 4)
      .map((r) => `Title: ${r.title}\nURL: ${r.url}\nSnippet: ${r.snippet}`)
      .join("\n\n");

    for (const result of (searchResults as Array<{ title: string; url: string; snippet: string }>).slice(0, 2)) {
      const content = await callMCPTool("fetch_page", { url: result.url });
      if (content) {
        webResearchData += `\n\n=== ${result.url} ===\n${content}`;
      }
    }
  }

  // 1f: Save brief to content_plans
  const brief = `Topik: ${topicData.topic}
Judul: ${topicData.title}
Keywords: ${(topicData.seo_keywords || []).join(", ")}
GSC: ${gscData ? "Ada" : "Tidak ada"}
Trend: ${trendData ? "Ada" : "Tidak ada"}

Web Research:
${webResearchData || "(Tidak ada web research)"}

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
```

- [ ] **Step 4: Add GSC API fetch function**

```typescript
async function fetchGSCKeywordGaps(): Promise<string> {
  const { GoogleAuth } = await import("google-auth-library");
  const auth = new GoogleAuth({
    credentials: {
      client_email: process.env.GSC_CLIENT_EMAIL,
      private_key: process.env.GSC_PRIVATE_KEY?.replace(/\\n/g, "\n"),
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
```

- [ ] **Step 5: Add Trend-Pulse runner**

```typescript
async function runTrendPulse(): Promise<string> {
  return new Promise((resolve) => {
    const child = spawn(TREND_PULSE_PATH, [
      "barbershop Indonesia",
      "gaya rambut trend",
      "perawatan rambut pria",
    ], {
      stdio: ["ignore", "pipe", "pipe"],
      timeout: 25000,
    });
    let output = "";
    child.stdout.on("data", (d: Buffer) => { output += d.toString(); });
    child.on("close", (code) => {
      if (code !== 0) resolve("");
      const lines = output.trim().split("\n").slice(0, 15);
      resolve(lines.join("\n"));
    });
    child.on("error", () => resolve(""));
    setTimeout(() => { child.kill(); resolve(""); }, 25000);
  });
}
```

- [ ] **Step 6: Update main() to call researchPhase and inject into content generation**

Replace the `main()` function to call research first:

```typescript
async function main() {
  console.log(`[blog-gen] Starting at ${new Date().toISOString()}`);
  const supabase = await createAdminClient();

  const research = await researchPhase(supabase);
  if (!research) {
    console.log("[blog-gen] Research failed or no topic found, skipping.");
    await recordMetric(supabase, "research_skipped", 1, {});
    return;
  }

  const { topicData, webResearchData, planId } = research;

  // ... rest of content generation and saving (Task 4)
}
```

- [ ] **Step 7: Ensure cron route passes env vars**

Edit `app/api/cron/generate-blog/route.ts` to pass all env vars (already uses `env: { ...process.env }` so it should pass through. No change needed.)

- [ ] **Step 8: Commit**

```bash
git add scripts/generate-blog-post.ts package.json
git commit -m "feat(blog): data-driven research with GSC, Trend-Pulse, and MCP"
```

---

### Task 4: Rewrite Blog Content Generation — Format Variety + QA

**Files:**
- Modify: `scripts/generate-blog-post.ts` (replace content prompt + add QA/regen)

- [ ] **Step 1: Replace content prompt with varied format rules**

Replace the `contentPrompt` variable (current lines 92-130). New prompt:

```typescript
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
```

- [ ] **Step 2: Add QA review phase after content generation**

Add after the `---METADATA` split (currently line 132). Replace the old Phase 3-4 code after metaSplit:

```typescript
  // Phase 3: QA Review
  console.log("[blog-gen] Phase 3: QA review...");
  const qaResult = await reviewBlogContent(contentHtml, topicData.title);

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
    await recordMetric(supabase, "qa_regen_rate", 1, { title: topicData.title });
  }

  await recordMetric(supabase, "qa_avg_score", qaResult.score, { title: topicData.title });
```

- [ ] **Step 3: Add `reviewBlogContent` function**

```typescript
import { askOpenRouter } from "@/lib/ollama";

async function reviewBlogContent(html: string, title: string): Promise<{ score: number; notes: string }> {
  const text = html.replace(/<[^>]*>/g, "");
  const prompt = `Kamu adalah QA reviewer konten blog. Review artikel berikut dan beri score 1-5.

KRITERIA PENILAIAN:
1. **Hook spesifik** (2 points): Apakah pendahuluan engaging, bukan generik kayak "Dalam era digital ini"?
2. **Format variety** (1 point): Apakah ada bullet list, numbering, tabel, blockquote? Atau semua cuma paragraf terus?
3. **No fake claims** (1 point): Apakah ada klaim tanpa data yang kelihatan mengada-ada?
4. **Tone natural** (1 point): Apakah bacaannya mengalir kayak majalah? Atau kaku kayak buku teks?

FORMAT RESPON (JSON SAJA, tanpa markdown):
{"score": 4, "notes": "Pendahuluan hook-nya bagus tapi kurang variasi tabel"}

ARTIKEL:
${text.slice(0, 3000)}`;

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
```

- [ ] **Step 4: Update main() to save with content_plan_id**

In the insert (current line 172), add content_plan_id:

```typescript
  const { data: draft, error: insertError } = await supabase.from("blog_posts").insert({
    title: topicData.title,
    slug,
    content_html: contentHtml,
    excerpt: seoData.excerpt || text.slice(0, 200),
    meta_description: seoData.meta_description || text.slice(0, 160),
    keywords: seoData.keywords || [],
    content_plan_id: planId,  // New column
    topics: seoData.topics || [],
    status: "draft",
  }).select("id").single();
```

- [ ] **Step 5: Add recordMetric calls in main()**

After successful save (after line 181):

```typescript
  await recordMetric(supabase, "posts_created", 1, { type: "blog" });
  await checkQualityAlerts(supabase);
```

- [ ] **Step 6: Verify script runs end-to-end**

Run: `npx tsx --no-warnings scripts/generate-blog-post.ts 2>&1 | head -50`
Expected: Should go through research → generate → QA → draft → notify (may fail at image gen or telegram if no env, but core logic should work)

- [ ] **Step 7: Commit**

```bash
git add scripts/generate-blog-post.ts
git commit -m "feat(blog): varied format content generation with QA review and auto-regen"
```

---

### Task 5: Create SEO Audit Script

**Files:**
- Create: `scripts/seo-audit.ts`
- Modify: `app/api/cron/generate-blog/route.ts` (no change needed)

- [ ] **Step 1: Create `scripts/seo-audit.ts`**

```typescript
import { createAdminClient } from "@/lib/supabase/admin";
import { recordMetric } from "@/lib/metrics";
import { sendTelegramMessage } from "@/lib/telegram";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";
const SITE_URL = "https://kapster.my.id";

interface PageAudit {
  url: string;
  title: { content: string | null; length: number; hasMultipleH1: boolean };
  metaDescription: { content: string | null; length: number };
  headings: { h1: number; h2: number; h3: number; h4: number; hierarchyValid: boolean };
  images: { total: number; withAlt: number; withoutAlt: number };
  canonical: { url: string | null; matchesExpected: boolean };
  og: { title: boolean; description: boolean; image: boolean };
  schema: { hasJsonLd: boolean; types: string[] };
  links: { internal: number; external: number };
  robotsIndexable: boolean;
  performanceScore: number | null;
  gsc: { queries: string[]; impressions: number; clicks: number; avgPosition: number | null } | null;
  pageError: string | null;
}

async function main() {
  console.log(`[seo-audit] Starting at ${new Date().toISOString()}`);
  const supabase = await createAdminClient();

  // Phase 1: URL discovery
  console.log("[seo-audit] Phase 1: URL discovery...");
  const urls = await discoverUrls(supabase);
  console.log(`[seo-audit] Found ${urls.length} URLs`);

  // Phase 2: Per-page audit
  console.log("[seo-audit] Phase 2: Auditing pages...");
  const audits: PageAudit[] = [];
  for (const url of urls) {
    console.log(`[seo-audit]   ${url}`);
    const audit = await auditPage(url);
    audits.push(audit);
    // Rate limit: 1 req / sec for PSI API
    await new Promise((r) => setTimeout(r, 1200));
  }

  // Phase 3: Scoring
  console.log("[seo-audit] Phase 3: Scoring...");
  const scores = audits.map(calcScore);
  const aggregateScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  const issuesCount = audits.filter((a) => !a.robotsIndexable || !a.title.content || !a.metaDescription.content).length;

  // Phase 4: LLM analysis
  console.log("[seo-audit] Phase 4: LLM analysis...");
  const analysis = await analyzeAudit(audits, scores, aggregateScore);

  // Phase 5: Save metrics
  console.log("[seo-audit] Phase 5: Saving metrics...");
  const metadata = {
    urlCount: urls.length,
    aggregateScore,
    scoreBreakdown: urls.map((u, i) => ({ url: u, score: scores[i] })),
    analysisSummary: analysis.summary,
    criticalIssues: analysis.critical,
    improvements: analysis.improvements,
  };

  await recordMetric(supabase, "seo_audit_score", aggregateScore, metadata);
  await recordMetric(supabase, "seo_audit_issues_count", issuesCount, { totalUrls: urls.length });

  // Compare with previous audit
  const { data: prevAudits } = await supabase
    .from("content_metrics")
    .select("metric_value, created_at, metadata")
    .eq("metric_name", "seo_audit_score")
    .order("created_at", { ascending: false })
    .limit(2);

  const prevScore = prevAudits && prevAudits.length > 1 ? prevAudits[1].metric_value : null;
  const delta = prevScore !== null ? aggregateScore - prevScore : 0;

  // Phase 6: Telegram notification
  console.log("[seo-audit] Phase 6: Telegram...");
  const emoji = delta > 0 ? "📈" : delta < 0 ? "📉" : "📊";
  const msg = `${emoji} *SEO Audit — kapster.my.id*
Skor: *${aggregateScore}/100*${delta !== 0 ? ` (${delta > 0 ? "+" : ""}${delta} dari sebelumnya)` : ""}

✅ *Improvement:*
${analysis.improvements.slice(0, 3).map((i: any) => `• ${i.page.slice(0, 40)}: ${i.change}`).join("\n") || "Tidak ada perubahan signifikan"}

⚠️ *Perlu tindakan:*
${analysis.critical.slice(0, 5).map((c: any) => `• [${c.impact.toUpperCase()}] ${c.issue}`).join("\n") || "Tidak ada isu kritis"}

💡 *Rekomendasi utama:*
${analysis.summary}`;

  await sendTelegramMessage(msg);
  console.log("[seo-audit] Done!");
}

async function discoverUrls(supabase: any): Promise<string[]> {
  const urls: string[] = [SITE_URL, `${SITE_URL}/blog`];

  // Fetch sitemap
  try {
    const res = await fetch(`${SITE_URL}/sitemap.xml`);
    const xml = await res.text();
    const locs = xml.match(/<loc>([^<]+)<\/loc>/g) || [];
    for (const loc of locs) {
      const u = loc.replace(/<\/?loc>/g, "");
      if (!urls.includes(u)) urls.push(u);
    }
  } catch {
    console.warn("[seo-audit] Sitemap fetch failed");
  }

  // Fetch published blog posts
  const { data: posts } = await supabase
    .from("blog_posts")
    .select("slug")
    .eq("status", "published");
  if (posts) {
    for (const post of posts) {
      const u = `${SITE_URL}/blog/${post.slug}`;
      if (!urls.includes(u)) urls.push(u);
    }
  }

  return urls.slice(0, 50);
}

async function auditPage(url: string): Promise<PageAudit> {
  const defaultAudit: PageAudit = {
    url,
    title: { content: null, length: 0, hasMultipleH1: false },
    metaDescription: { content: null, length: 0 },
    headings: { h1: 0, h2: 0, h3: 0, h4: 0, hierarchyValid: true },
    images: { total: 0, withAlt: 0, withoutAlt: 0 },
    canonical: { url: null, matchesExpected: true },
    og: { title: false, description: false, image: false },
    schema: { hasJsonLd: false, types: [] },
    links: { internal: 0, external: 0 },
    robotsIndexable: true,
    performanceScore: null,
    gsc: null,
    pageError: null,
  };

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    const html = await res.text();

    // Title
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    defaultAudit.title = {
      content: titleMatch?.[1]?.trim() || null,
      length: (titleMatch?.[1]?.trim() || "").length,
      hasMultipleH1: (html.match(/<h1[\s\S]*?<\/h1>/gi) || []).length > 1,
    };

    // Meta description
    const metaDesc = html.match(/<meta\s+[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i);
    defaultAudit.metaDescription = {
      content: metaDesc?.[1] || null,
      length: (metaDesc?.[1] || "").length,
    };

    // Headings
    defaultAudit.headings.h1 = (html.match(/<h1[\s\S]*?<\/h1>/gi) || []).length;
    defaultAudit.headings.h2 = (html.match(/<h2[\s\S]*?<\/h2>/gi) || []).length;
    defaultAudit.headings.h3 = (html.match(/<h3[\s\S]*?<\/h3>/gi) || []).length;
    defaultAudit.headings.h4 = (html.match(/<h4[\s\S]*?<\/h4>/gi) || []).length;
    // Hierarchy valid: H1 exists and first heading is H1
    const firstHeading = html.match(/<(h[1-6])[\s>]/i);
    defaultAudit.headings.hierarchyValid = !!(defaultAudit.headings.h1 === 1 && firstHeading?.[1] === "h1");

    // Images
    const imgTags = html.match(/<img[\s\S]*?>/gi) || [];
    defaultAudit.images.total = imgTags.length;
    defaultAudit.images.withAlt = imgTags.filter((img) => /alt\s*=\s*["']/.test(img)).length;
    defaultAudit.images.withoutAlt = defaultAudit.images.total - defaultAudit.images.withAlt;

    // Canonical
    const canonicalMatch = html.match(/<link\s+[^>]*rel=["']canonical["'][^>]*href=["']([^"']*)["']/i);
    defaultAudit.canonical = {
      url: canonicalMatch?.[1] || null,
      matchesExpected: !!(canonicalMatch?.[1] && canonicalMatch[1] === url),
    };

    // OG tags
    defaultAudit.og = {
      title: /<meta\s+[^>]*property=["']og:title["']/i.test(html),
      description: /<meta\s+[^>]*property=["']og:description["']/i.test(html),
      image: /<meta\s+[^>]*property=["']og:image["']/i.test(html),
    };

    // Schema.org JSON-LD
    const jsonLdBlocks = html.match(/<script\s+[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) || [];
    const types: string[] = [];
    for (const block of jsonLdBlocks) {
      try {
        const json = JSON.parse(block.replace(/<[^>]*>/g, ""));
        const t = json["@type"] || (Array.isArray(json["@graph"]) ? json["@graph"][0]?.["@type"] : null);
        if (t) types.push(t);
      } catch { /* skip parse errors */ }
    }
    defaultAudit.schema = { hasJsonLd: jsonLdBlocks.length > 0, types };

    // Links
    const allLinks = html.match(/<a\s+[^>]*href=["']([^"']*)["']/gi) || [];
    defaultAudit.links.internal = allLinks.filter((l) => {
      const href = l.match(/href=["']([^"']*)["']/i)?.[1] || "";
      return href.startsWith("/") || href.startsWith(SITE_URL);
    }).length;
    defaultAudit.links.external = allLinks.length - defaultAudit.links.internal;

    // Robots meta
    const robotsMeta = html.match(/<meta\s+[^>]*name=["']robots["'][^>]*content=["']([^"']*)["']/i);
    defaultAudit.robotsIndexable = !robotsMeta || !robotsMeta[1].includes("noindex");

    // PageSpeed Insights
    try {
      const psiKey = process.env.PSI_API_KEY;
      if (psiKey) {
        const psiRes = await fetch(
          `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=mobile&key=${psiKey}`,
          { signal: AbortSignal.timeout(20000) },
        );
        const psiData = await psiRes.json();
        defaultAudit.performanceScore = Math.round(
          (psiData.lighthouseResult?.categories?.performance?.score || 0) * 100,
        );
      }
    } catch {
      console.warn(`[seo-audit]   PSI failed for ${url}`);
    }

  } catch (err) {
    defaultAudit.pageError = String(err);
  }

  // GSC data (batch query instead — will be null here, filled in batch phase)
  return defaultAudit;
}

function calcScore(audit: PageAudit): number {
  const titleScore = audit.title.content && audit.title.length >= 30 && audit.title.length <= 60 ? 1 : 0.5;
  const metaScore = audit.metaDescription.content && audit.metaDescription.length >= 120 && audit.metaDescription.length <= 160 ? 1 : 0.5;
  const headingScore = audit.headings.h1 === 1 && audit.headings.hierarchyValid ? 1 : 0.5;
  const imageScore = audit.images.total > 0 ? audit.images.withAlt / audit.images.total : 1;
  const schemaScore = audit.schema.hasJsonLd ? 1 : 0.3;
  const canonicalScore = audit.canonical.matchesExpected ? 1 : 0.5;
  const ogScore = (audit.og.title && audit.og.description && audit.og.image) ? 1 : 0.5;
  const linkScore = audit.links.internal > audit.links.external ? 1 : 0.7;
  const robotsScore = audit.robotsIndexable ? 1 : 0;
  const perfScore = audit.performanceScore !== null ? audit.performanceScore / 100 : 0.5;

  const onpage = (titleScore * 15 + metaScore * 12 + headingScore * 12 + imageScore * 10 +
    schemaScore * 10 + canonicalScore * 8 + ogScore * 8 + linkScore * 5 + robotsScore * 5) / 85 * 100;

  const perfWeighted = perfScore * 100;

  // GSC: skip if no data
  const gscWeighted = audit.gsc ? calcGscScore(audit.gsc) : 50;

  return Math.round(onpage * 0.45 + gscWeighted * 0.30 + perfWeighted * 0.25);
}

function calcGscScore(gsc: NonNullable<PageAudit["gsc"]>): number {
  const posScore = gsc.avgPosition ? Math.max(0, (30 - gsc.avgPosition) / 29 * 100) : 50;
  const ctrBonus = gsc.clicks > 0 && gsc.impressions > 0 ? (gsc.clicks / gsc.impressions) : 0;
  const ctrScore = ctrBonus > 0.1 ? 20 : ctrBonus > 0.05 ? 10 : 0;
  const impScore = gsc.impressions > 1000 ? 5 : 0;
  return Math.min(100, posScore + ctrScore + impScore);
}

async function analyzeAudit(
  audits: PageAudit[],
  scores: number[],
  aggregateScore: number,
): Promise<{ summary: string; critical: Array<{ page: string; issue: string; impact: string; fix: string }>; improvements: Array<{ page: string; metric: string; change: string }> }> {
  const auditSummary = audits.map((a, i) =>
    `URL: ${a.url}\nScore: ${scores[i]}\n${a.pageError ? `ERROR: ${a.pageError}` : ""}` +
    `Title: ${a.title.content ? `${a.title.content} (${a.title.length} chars, multiple H1: ${a.title.hasMultipleH1})` : "MISSING"}` +
    `\nMeta: ${a.metaDescription.content ? `${a.metaDescription.length} chars` : "MISSING"}` +
    `\nHeadings: H1=${a.headings.h1} H2=${a.headings.h2} H3=${a.headings.h3}` +
    `\nImages: ${a.images.withoutAlt}/${a.images.total} without alt` +
    `\nSchema: ${a.schema.hasJsonLd} (${a.schema.types.join(", ")})` +
    `\nCanonical: ${a.canonical.url ? "ok" : "missing"}` +
    `\nOG: title=${a.og.title} desc=${a.og.description} img=${a.og.image}` +
    `\nIndexable: ${a.robotsIndexable}` +
    `\nPerformance: ${a.performanceScore ?? "N/A"}` +
    `\n---`
  ).join("\n");

  const prompt = `Kamu adalah SEO auditor untuk kapster.my.id. Analisis hasil audit berikut dan beri rekomendasi prioritas.

AGGREGATE SCORE: ${aggregateScore}/100

PER-PAGE AUDIT:
${auditSummary}

RESPON JSON SAJA (tanpa markdown):
{
  "summary": "1 kalimat rekomendasi utama yang paling penting",
  "critical": [
    {"page": "url", "issue": "deskripsi", "impact": "high/medium/low", "fix": "langkah perbaikan"}
  ],
  "improvements": [
    {"page": "url", "metric": "contoh: performance score", "change": "contoh: 65 → 72"}
  ]
}`;

  try {
    const raw = await callGroq(prompt, 0.3, 2000);
    const cleaned = raw.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return {
      summary: "Analisis gagal, periksa log",
      critical: [],
      improvements: [],
    };
  }
}

async function callGroq(prompt: string, temperature = 0.3, maxTokens = 4096): Promise<string> {
  if (!process.env.GROQ_API_KEY) throw new Error("GROQ_API_KEY not set");
  const res = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [{ role: "system", content: "Kamu adalah asisten SEO Kapster. Jawab dalam Bahasa Indonesia." }, { role: "user", content: prompt }],
      max_tokens: maxTokens,
      temperature,
    }),
    signal: AbortSignal.timeout(120000),
  });
  if (!res.ok) throw new Error(`Groq API error ${res.status}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

main().catch((err) => {
  console.error("[seo-audit] Fatal:", err);
  process.exit(1);
});
```

- [ ] **Step 2: Test the script runs**

Run: `npx tsx --no-warnings scripts/seo-audit.ts 2>&1 | head -30`
Expected: Should log URL discovery and start auditing pages.

- [ ] **Step 3: Commit**

```bash
git add scripts/seo-audit.ts
git commit -m "feat(seo): add SEO audit script with HTML parsing, PSI, and LLM analysis"
```

---

### Task 6: Create SEO Audit Cron Endpoint

**Files:**
- Create: `app/api/cron/seo-audit/route.ts`

- [ ] **Step 1: Create `app/api/cron/seo-audit/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";
import path from "path";

const CRON_SECRET = process.env.CRON_SECRET;

function verifyAuth(request: NextRequest): boolean {
  const auth = request.headers.get("authorization")?.replace("Bearer ", "");
  return auth === CRON_SECRET;
}

function runAudit() {
  const scriptPath = path.join(process.cwd(), "scripts/seo-audit.ts");
  spawn("npx", ["tsx", scriptPath], {
    cwd: process.cwd(),
    stdio: "inherit",
    env: { ...process.env },
  });
}

export async function GET(request: NextRequest) {
  if (!verifyAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  runAudit();
  return NextResponse.json({ ok: true, message: "SEO audit started" });
}

export async function POST(request: NextRequest) {
  if (!verifyAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  runAudit();
  return NextResponse.json({ ok: true, message: "SEO audit started" });
}
```

- [ ] **Step 2: Verify endpoint pattern matches existing cron routes**

Run: `diff <(head -20 app/api/cron/generate-blog/route.ts) <(head -20 app/api/cron/seo-audit/route.ts)`
Expected: Same auth pattern.

- [ ] **Step 3: Commit**

```bash
git add app/api/cron/seo-audit/route.ts
git commit -m "feat(seo): add SEO audit cron endpoint"
```

---

### Task 7: Deploy

**Files:**
- Modify: `deploy.sh` (if exists) or manual deploy

- [ ] **Step 1: Verify build**

Run: `npm run build`
Expected: No TS errors from new/changed files.

- [ ] **Step 2: Deploy to server**

Run: `bash deploy.sh` (or manual SSH steps: git pull → npm install → npm run build → pm2 restart all)

- [ ] **Step 3: Test SEO audit endpoint**

Run: `curl -H "Authorization: Bearer $CRON_SECRET" https://kapster.my.id/api/cron/seo-audit`
Expected: `{"ok":true,"message":"SEO audit started"}`

- [ ] **Step 4: Set up weekly cron (add to server crontab)**

```
# SEO audit — every Monday at 07:00 WIB (00:00 UTC)
0 0 * * 1 curl -H "Authorization: Bearer $CRON_SECRET" https://kapster.my.id/api/cron/seo-audit
```

- [ ] **Step 5: Adjust blog cron to daily (if currently every 12h)**

Edit crontab to change blog gen to 1x/day:

```
# Blog generation — once daily at 06:00 WIB (23:00 UTC)
0 23 * * * curl -H "Authorization: Bearer $CRON_SECRET" https://kapster.my.id/api/cron/generate-blog
```

- [ ] **Step 6: Commit**

```bash
git add scripts/seo-audit.ts app/api/cron/seo-audit/route.ts
git commit -m "chore: deploy SEO audit agent and update cron schedule"
```

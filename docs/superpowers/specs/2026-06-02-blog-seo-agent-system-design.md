# Blog + SEO Audit Agent System

## Problem

Blog Kapster saat ini pakai pipeline lama:
- **Research** cuma satu query hardcoded ke MCP DuckDuckGo — tidak adaptif, tidak pakai data Search Console real
- **Format konten** rigid — semua sub-bab pakai pola sama, jarang bullet/list/tabel, monoton
- **Tidak ada quality tracking** — konten lewat tanpa QA, tanpa monitoring
- **Tidak ada SEO audit** — tidak tahu posisi keyword, performance, atau technical issues dari waktu ke waktu

## Solution

Bangun dua agent independen yang berbagi infrastruktur:
1. **Blog Agent** — upgrade pipeline blog dengan arsitektur sama seperti sosial media (riset berbasis data real → LLM konten → QA → simpan)
2. **SEO Audit Agent** — periodic audit semua halaman Kapster, track score dari waktu ke waktu, notifikasi ke Telegram

## Architecture

```
                        ┌─────────────────────────────┐
                        │      Cron (1x/hari)          │
                        │  app/api/cron/generate-blog  │
                        └──────────┬──────────────────┘
                                   │
Blog Agent ────────────────────────┤
                                   │
  ┌────────────────────────────────▼─────────────────┐
  │  Phase 1: Research                               │
  │                                                   │
  │  1. GSC API → keyword gaps (pos 11-20, high imp) │
  │  2. LLM → pilih topik strategis (dari data GSC)  │
  │  3. Trend-Pulse → trend terkait, geo=ID          │
  │  4. MCP web search → deep dive 2-3 sumber        │
  │  5. Save brief ke content_plans (pending)         │
  └─────────────────────┬────────────────────────────┘
                        │
  ┌─────────────────────▼────────────────────────────┐
  │  Phase 2: Content Generation                      │
  │                                                   │
  │  1. Baca brief dari content_plans (pending)       │
  │  2. Groq llama-3.3-70b → generate HTML artikel    │
  │     - Variasi struktur antar section              │
  │     - Bullet, numbering, tabel, blockquote        │
  │     - Natural tone (majalah, bukan teks)          │
  │     - Transisi antar sub-bab                      │
  │  3. QA via OpenRouter (gpt-oss-120b:free)         │
  │     - Format variety check                        │
  │     - Hook quality                                │
  │     - No fake claims                              │
  │     - Flow natural                                │
  │  4. Auto-regen jika QA < 4                        │
  │  5. Save ke blog_posts (draft)                    │
  │  6. Image generation (Puter AI / card)            │
  │  7. Telegram notification (Post/Cancel)           │
  └──────────────────────────────────────────────────┘

                        ┌─────────────────────────────┐
                        │      Cron (1x/minggu)        │
                        │  app/api/cron/seo-audit      │
                        └──────────┬──────────────────┘
                                   │
SEO Audit Agent ───────────────────┤
                                   │
  ┌────────────────────────────────▼─────────────────┐
  │  Phase 1: URL Discovery                           │
  │  - Parse sitemap.xml                              │
  │  - Query blog_posts table                         │
  │  - Daftar URL: landing + blog + pricing + about   │
  └─────────────────────┬────────────────────────────┘
                        │
  ┌─────────────────────▼────────────────────────────┐
  │  Phase 2: Per-page Audit                          │
  │  (in-process fetch + parse, tanpa MCP)            │
  │                                                   │
  │  Technical (HTML parse):                          │
  │  - Meta title (ada? length 30-60? unik?)          │
  │  - Meta description (ada? length 120-160?)        │
  │  - H1 count (=1? ada?)                            │
  │  - Heading hierarchy (h1→h2→h3)                   │
  │  - Image alt text coverage                        │
  │  - Canonical URL                                  │
  │  - Open Graph (title, desc, image, url, type)     │
  │  - Schema.org/JSON-LD (tipe? valid?)              │
  │  - Internal vs external link ratio                │
  │  - robots meta tag                                │
  │                                                   │
  │  Performance (PageSpeed API):                     │
  │  - LCP, CLS, INP (Core Web Vitals)                │
  │  - Performance score (0-100)                      │
  │                                                   │
  │  Search (GSC API - cache 24h):                    │
  │  - Top 5 queries per page                         │
  │  - Impressions, clicks, avg position              │
  │  - CTR                                            │
  └─────────────────────┬────────────────────────────┘
                        │
  ┌─────────────────────▼────────────────────────────┐
  │  Phase 3: Scoring + LLM Analysis                  │
  │                                                   │
  │  Score = weighted composite (0-100):              │
  │  - On-page HTML: 25% (title, meta, headings,      │
  │    images, links, canonical, robots)               │
  │  - Content & Schema: 25% (schema.org, OG,         │
  │    content quality via LLM)                        │
  │  - Performance: 20% (PageSpeed, Core Web Vitals)  │
  │  - GSC signals: 30% (impressions, clicks,         │
  │    avg position, CTR)                              │
  │                                                   │
  │  LLM (Groq) membaca hasil audit per-page +        │
  │  score breakdown → rekomendasi prioritas           │
  |  → bandingkan dengan audit sebelumnya             │
  └─────────────────────┬────────────────────────────┘
                        │
  ┌─────────────────────▼────────────────────────────┐
  │  Phase 4: Save + Notify                           │
  │                                                   │
  │  1. Save ke content_metrics:                      │
  │     - metric: seo_audit_score (aggregate)         │
  │     - metric: seo_audit_detail (per-page JSON)    │
  │     - metric: seo_audit_issues_count              │
  │  2. Notifikasi Telegram:                          │
  │     - Aggregate score + delta                     │
  │     - Top improvements                            │
  │     - Top issues (priority: high/med/low)         │
  │     - Recommendation utama                        │
  └──────────────────────────────────────────────────┘
```

## Blog Agent — Research Detail

### GSC Keyword Gap Analysis

Query ke GSC API:
```
dimensions: [query, page]
startDate: 90 hari lalu
endDate: hari ini
rowLimit: 500
orderBy: [impressions desc]
```

Filter di aplikasi:
- `avgPosition BETWEEN 11 AND 20` — striking distance
- `impressions > 100` — cukup volume
- Dedup dengan judul existing blog posts

Hasil → kirim ke LLM untuk pilih 1 topik strategis.

### Topic Selection Prompt

LLM menerima:
1.  GSC keyword gaps (query + impressions + posisi)
2.  Existing blog post titles
3.  Trend-Pulse output (trend terkini geo=ID)

LLM menentukan 1 topik — **bisa radius dari barbershop**, tidak harus langsung:
- "Sejarah kursi" → kaitkan ke kursi barbershop
- "Psikologi gaya rambut" → kaitkan ke self-esteem → Kapster
- Boleh topik serius, teknis, atau ringan — yang penting ada celah SEO

### Trend-Pulse Integration

Sama seperti sosial media:
- Sumber: `google_trends, google_news, reddit, wikipedia`
- Geo: ID
- Timeout: 25s
- Jika kosong → skip (jangan paksa generate topik tanpa data)

### MCP Web Search

- Query: berdasarkan topik yang dipilih LLM
- Deep dive: fetch 2-3 halaman relevan
- Output: content brief → simpan ke `content_plans`

## Blog Agent — Content Format

### Variasi Struktur

Aturan prompt konten baru (rewrite total):

1. **Tidak boleh ada dua sub-bab berturut-turut dengan pola tag sama**
   ✅ Section 1: h2 → p → ul, Section 2: h2 → blockquote → p → ol
   ❌ Section 1: h2 → p → ul, Section 2: h2 → p → ul

2. **WAJIB minimal 1 bullet list** (`<ul>`), **1 numbered list** (`<ol>`), **1 blockquote**, **1 tabel** per artikel. Kombinasi bebas asal tidak berurutan sama.

3. **Pendahuluan variatif** — ganti-ganti tiap artikel: hook data, pertanyaan retoris, analogi, cerita pendek, kutipan

4. **Panjang sub-bab tidak seragam** — range 150-600, natural flow

5. **Transisi** — setiap sub-bab ada kalimat yang nyambung dari sebelumnya

6. **Tone** — seperti tulisan majalah/koran, bukan laporan teknis. Boleh ada humor ringan, bahasa sehari-hari, atau sindiran halus yang relevan.

7. **CTA tetap di akhir** — tidak diubah dari existing template

### QA Review

Sama seperti sosial media:
- Provider: OpenRouter `openai/gpt-oss-120b:free`
- Fallback: Groq `llama-3.3-70b-versatile`
- Kriteria:
  1. Hook spesifik (bukan generik)
  2. Format variety (ada bullet/list/tabel/blockquote?)
  3. No fake claims
  4. Tone natural (tidak kaku)
- Jika score < 4 → auto-regen dengan feedback sebagai additional context

## SEO Audit Agent — Detail

### Page Discovery

1. Fetch `https://kapster.my.id/sitemap.xml` → parse semua `<url>` entries
2. Query `blog_posts` WHERE `status = 'published'` → tambah slug ke list
3. Static pages: `/`, `/blog`, `/pricing`, `/about` (atau sesuai sitemap)
4. Limit: max 50 URL per audit (biar tidak kena rate limit PageSpeed API)

### Per-page Audit (inline)

Tidak perlu MCP terpisah — fetch + parse langsung dari Node:

```
async function auditPage(url: string) {
  const html = await fetch(url).text();
  const $ = cheerio.load(html);  // atau regex-based parser untuk zero dep

  return {
    title: { content, length, hasMultipleH1 },
    metaDescription: { content, length },
    headings: { h1: [...], h2: [...], h3: [...], hierarchyValid },
    images: { total, withAlt, withoutAlt },
    canonical: { url, matchesExpected },
    og: { title, description, image, url, type },
    schema: { jsonldCount, types, parseErrors },
    links: { internal, external, broken: [] },
    robotsMeta: { content, indexable },
  };
}
```

### PageSpeed API

```
GET https://www.googleapis.com/pagespeedonline/v5/runPagespeed
  ?url={url}
  &strategy=mobile
  &key={PSI_API_KEY}

Response → { loadingExperience, lighthouseResult }
```

Cache score per URL 24 jam (tidak berubah setiap jam).

### GSC API

Gunakan Google Search Console API v3 (Webmasters).

Setup:
- Service Account (lebih clean untuk server-side)
- Buat service account di Google Cloud Console
- Grant service account sebagai **Owner** di GSC property (`kapster.my.id`)
- Scopenya: `https://www.googleapis.com/auth/webmasters.readonly`

Query per page:
```
POST https://searchconsole.googleapis.com/v1/sites/{siteUrl}/searchAnalytics/query
{
  startDate: "90 hari lalu",
  endDate: "hari ini",
  dimensionFilterGroups: [{
    filters: [{
      dimension: "page",
      operator: "equals",
      expression: url
    }]
  }],
  dimensions: ["query"],
  rowLimit: 5,
  orderBy: [{ metricName: "impressions", sortOrder: "DESCENDING" }]
}
```

GSC data di-cache 24 jam — jangan panggil per-url setiap audit, cukup sekali batch.

### Scoring

Weighted formula:

**On-page score** (0-100):
```
onpage_score = (title          * 0.15 +
                meta_desc      * 0.12 +
                headings       * 0.12 +
                images_alt     * 0.10 +
                schema         * 0.10 +
                canonical      * 0.08 +
                og             * 0.08 +
                links          * 0.05 +
                robots         * 0.05) * 100
```
Setiap komponen 0-1 (baik = 1, buruk = 0).

**GSC signal score** (0-100):
```
gsc_score = max(0, (30 - avg_position) / 29 * 100)
            + CTR_bonus (CTR > 5% = +10, CTR > 10% = +20)
            + impressions_bonus (>1000/bulan = +5)
```

**Performance score** (0-100): Langsung dari PageSpeed API `lighthouseResult.categories.performance.score * 100`.

**Content quality score** (0-100): Dari LLM analysis — membaca readability, keyword usage, content depth, structured data.

**Final score:**
```
final_score = onpage_score       * 0.25 +
              gsc_score          * 0.30 +
              performance_score  * 0.20 +
              content_quality    * 0.25
```

### LLM Analysis

Groq membaca:
1. Per-page audit data
2. Score breakdown
3. Previous audit score (dari content_metrics)

Output: rekomendasi prioritas dalam format:
```
{
  "summary": "Overall site improved 3 points...",
  "critical": [
    {"page": "/blog/...", "issue": "No meta description", "impact": "high", "fix": "Add 120-160 char description"}
  ],
  "improvements": [
    {"page": "/", "metric": "LCP", "previous": 4.2, "current": 2.8, "change": "improved"}
  ]
}
```

## Data Model

### New metric names in `content_metrics`

| metric_name | type | description |
|-------------|------|-------------|
| `seo_audit_score` | numeric | Aggregate SEO score (0-100) |
| `seo_audit_detail` | jsonb | Per-page audit data |
| `seo_audit_issues_count` | numeric | Total issues found |
| `blog_qa_score` | numeric | QA score per blog post |
| `blog_qa_regen` | boolean | Apakah regenerasi? |
| `gsc_queries_count` | numeric | Jumlah unique queries from GSC |

### blog_posts additions

| column | type | description |
|--------|------|-------------|
| `content_plan_id` | uuid (FK → content_plans) | Hubungkan ke brief riset |

## Cron Schedule

| Endpoint | Frekuensi | Tujuan |
|----------|-----------|--------|
| `app/api/cron/generate-blog/route.ts` | 1x/hari | Run blog agent (research → generate) |
| `app/api/cron/seo-audit/route.ts` | 1x/minggu | Run SEO audit |

## Configuration

Environment variables baru:
- `PSI_API_KEY` — Google PageSpeed Insights API key (free, 25k/hari)
- `GSC_CLIENT_EMAIL` — Service Account email untuk GSC API
- `GSC_PRIVATE_KEY` — Service Account private key (JWT auth, tanpa refresh token)
- `GSC_SITE_URL` — `sc-domain:kapster.my.id`

Migration:
- Tambah kolom `content_plan_id` ke `blog_posts`
- Tidak perlu tabel baru (pakai `content_metrics` existing)

## Error Handling

### Blog Agent
- Jika GSC API gagal (quota/network) → skip GSC, lanjut pakai Trend-Pulse + web search
- Jika Trend-Pulse kosong → skip hari itu, jangan paksa generate
- Jika Groq gagal → retry 1x, jika masih gagal skip
- Jika QA gagal (OpenRouter + Groq both fail) → post tetap lanjut tanpa QA (record metric)

### SEO Audit
- Jika PageSpeed API rate limit → batch 10 URL/jam, spread selama seminggu
- Jika GSC API gagal → audit tanpa GSC signals, catat di log
- Jika URL fetch gagal (404/timeout) → catat sebagai issue, skip page

## Dependencies

Existing (tidak berubah):
- `groq-sdk` — content generation
- OpenRouter via `lib/ollama.ts` — QA review
- Trend-Pulse Python CLI — trend research
- `@modelcontextprotocol/sdk` — MCP web search

New:
- `cheerio` atau HTML parser — untuk SEO audit page parsing (inline, bukan MCP)
- Google APIs Node.js client — untuk GSC API (atau fetch langsung)
- `node:http2` — PageSpeed API via fetch

## Implementation Order

1. **Format konten rewrite** — update prompt di `scripts/generate-blog-post.ts` dengan struktur variatif
2. **Blog agent research upgrade** — integrasi GSC API + Trend-Pulse + topic selection LLM
3. **Blog agent QA integration** — port QA flow dari sosial media ke blog pipeline
4. **SEO audit agent — basic** — page discovery + technical HTML audit (cheerio)
5. **SEO audit agent — PageSpeed** — integrasi PSI API
6. **SEO audit agent — GSC** — integrasi GSC API
7. **SEO audit agent — LLM + notifikasi** — analisis + score tracking + Telegram
8. **Monitoring + metrics** — semua metric tercatat ke `content_metrics`

# Blog & Content Generator — Design Doc

## Overview

Add a blog to kapster.my.id with automatic content generation (2 articles/day) using Groq LLM. Content is generated as draft, reviewed via Telegram inline buttons (Post/Cancel), then published. Goal: improve SEO ranking with high-quality, in-depth articles about the barbershop industry in Bahasa Indonesia, each ending with CTA to Kapster.

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Database:** Supabase PostgreSQL (existing)
- **LLM:** Groq (llama-3.3-70b-versatile) via existing `lib/groq.ts`
- **Image Generation:** Puter API (https://developer.puter.com)
- **MCP Server:** Custom `@kapster/content-researcher` for web research tools
- **Cron:** VPS system cron → Node.js script via `npx tsx` (2x/day)
- **Telegram Bot:** Extended for inline keyboard (Post/Cancel buttons)
- **Trigger:** dagshub or github api untuk trigger regenerasi konten
- **Deployment:** VPS PM2 (existing)

## Database Schema

### New Table: `blog_posts`

```sql
CREATE TABLE blog_posts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           TEXT NOT NULL,
  slug            TEXT NOT NULL UNIQUE,
  content_html    TEXT NOT NULL,
  excerpt         TEXT NOT NULL,
  meta_description TEXT NOT NULL DEFAULT '',
  keywords        TEXT[] DEFAULT '{}',
  og_image_url    TEXT,
  topics          TEXT[] DEFAULT '{}',
  status          TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'cancelled')),
  telegram_msg_id  INTEGER, -- untuk update/edit pesan Telegram
  published_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_blog_posts_status ON blog_posts (status, published_at DESC);
CREATE INDEX idx_blog_posts_slug ON blog_posts (slug);
CREATE INDEX idx_blog_posts_topics ON blog_posts USING GIN (topics);
```

### RLS Policy

Blog posts are publicly readable (published only). Cron script uses service_role for writes.

```sql
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published posts are publicly readable"
  ON blog_posts FOR SELECT
  USING (status = 'published' AND published_at <= NOW());

CREATE POLICY "Service role can do all"
  ON blog_posts FOR ALL
  USING (true)
  WITH CHECK (true);
```

## MCP Server: Content Researcher

### Location: `mcp-servers/content-researcher/`

A standalone MCP server that provides web research tools for the content generation agent.

### Tools Exposed

| Tool | Description | Parameters |
|------|-------------|------------|
| `web_search` | Search web for topic research | query: string, num_results?: number |
| `fetch_page` | Fetch & extract readable content from a URL | url: string |
| `search_competitor_content` | Search for competitor blog content on a topic | topic: string |

### Transport

stdio (spawned by the cron script as child process).

### Implementation

Uses `@modelcontextprotocol/sdk` for the MCP server. Web search via SerpAPI or DuckDuckGo scraping. Content extraction via Readability.

## Blog Pages (Next.js App Router)

### Page Structure

```
app/
├── blog/
│   ├── page.tsx              → Blog list (paginated, 12 per page)
│   ├── layout.tsx            → Blog layout (metadata, shared UI)
│   ├── page/
│   │   └── [page]/
│   │       └── page.tsx      → Pagination pages
│   └── [slug]/
│       └── page.tsx          → Blog detail page
```

### Blog List (`/blog`)

- Server component fetching from Supabase (status = 'published')
- ISR with `revalidate = 3600` (1 hour)
- Shows: thumbnail, title, excerpt, date, tags
- Pagination at bottom

### Blog Detail (`/blog/[slug]`)

- `generateMetadata()` for dynamic SEO meta tags
- Article schema JSON-LD
- BreadcrumbList schema
- Content rendered as HTML with Tailwind prose
- CTA section at bottom (Kapster promotion)
- Sidebar: related posts by topics

### Sitemap & Robots

- Update `app/sitemap.ts` — include all published blog slugs
- Update `app/robots.ts` — allow `/blog`

## Content Generator Pipeline

### Script: `scripts/generate-blog-post.ts`

### Schedule: every 12 hours (2 posts/day)
```
0 */12 * * * cd /var/www/kapster && /usr/bin/npx tsx scripts/generate-blog-post.ts >> /var/log/kapster-blog.log 2>&1
```

### Pipeline

```
┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
│ Phase 1  │   │ Phase 2  │   │ Phase 3  │   │ Phase 4  │   │ Phase 5  │   │ Phase 6  │
│ Research │──→│ Topic    │──→│ Content  │──→│ Image    │──→│ Telegram │──→│ Save as  │
│ (MCP     │   │ Selection│   │ Generate│   │ Generate │   │ Notify   │   │ Draft    │
│  tools)  │   │ (Groq)   │   │ (Groq)   │   │ (Puter)  │   │ + Buttons│   │ (DB)     │
└──────────┘   └──────────┘   └──────────┘   └──────────┘   └──────────┘   └──────────┘
```

**Phase 1 — Research (MCP Server):**
1. Spawn MCP server as child process
2. Call `web_search` for trending barbershop topics
3. Call `fetch_page` on competitor/reference articles
4. Fetch existing blog posts from DB for gap analysis
5. Compile research results

**Phase 2 — Topic Selection (Groq):**
1. Send research data + existing posts to Groq
2. Groq picks ONE topic for in-depth article (~3000+ words)
3. Must be barbershop-adjacent, high SEO potential, not duplicating existing content

**Phase 3 — Content Generation (Groq):**
1. Groq generates in-depth article (~3000+ words Bahasa Indonesia)
2. Structure: H1 → intro → 5-7 H2 sections → conclusion → CTA Kapster
3. Must include data, insights, practical tips (not shallow content)

**Phase 4 — Image Generation (Puter API):**
1. Call Puter API with prompt based on article topic
2. Save returned image URL as og_image_url

**Phase 5 — Telegram Notification:**
1. Send to user via Telegram bot with:
   - Title, excerpt (first 200 chars)
   - Inline keyboard: [Post ✅] [Cancel ❌]
2. Save telegram_msg_id in DB for later updates

**Phase 6 — Save as Draft:**
1. Insert into Supabase with status = 'draft'
2. Log success/failure

## Telegram Bot — Inline Keyboard Flow

### Updated `lib/telegram.ts`

Add support for `sendInlineKeyboard()`:
- Same `sendMessage` but with `reply_markup` containing inline_keyboard
- `Post` button → callback_data = `blog_post:{id}`
- `Cancel` button → callback_data = `blog_cancel:{id}`

### New Webhook Handler: `app/api/telegram/webhook/route.ts`

1. Receives POST from Telegram (callback_query)
2. Parse callback_data:
   - `blog_post:{id}` → UPDATE blog_posts SET status='published', published_at=NOW()
   - `blog_cancel:{id}` → UPDATE blog_posts SET status='cancelled'
3. Answer callback query (remove loading state on button)
4. Edit message to show confirmation text + remove keyboard

### Setting Webhook

```bash
curl -X POST https://api.telegram.org/bot{BOT_TOKEN}/setWebhook \
  -d "url=https://kapster.my.id/api/telegram/webhook"
```

## SEO Strategy

### Per-Page SEO
- Unique title tag (50-60 chars)
- meta_description (150–160 chars)
- Canonical URL
- OpenGraph tags + Twitter Card
- Proper heading hierarchy (H1 → H2 → H3)

### Structured Data
- Article schema on each post
- BreadcrumbList on list + detail

### Content Quality
- In-depth articles (3000+ words)
- Original research / unique angles
- Natural CTA integration
- Internal linking between posts

### Sitemap
- Update existing `sitemap.ts` with all published blog posts
- Priority: 0.8 for posts, 0.5 for list page

## Dagshub / GitHub API Trigger

Selain cron, content generation juga bisa dipicu via:
- **GitHub API:** Push ke branch tertentu trigger workflow
- **Dagshub:** Untuk experiment tracking dan model versioning

Ini opsional — cron 2x/hari sudah cukup untuk fase awal.

## Monitoring & Logging

- Script logs to `/var/log/kapster-blog.log`
- Errors sent via existing Telegram error-logger
- Dashboard can optionally show blog post list

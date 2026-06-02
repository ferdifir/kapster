# Content Planning Agent System

## Problem

Konten sosial media Kapster selama ini template semua — topik hanya variasi dari
"optimalkan [X] untuk meningkatkan pendapatan barbershop". Bigram dedup tidak
nangkep karena kata generik sudah masuk COMMON_WORDS. Akibatnya: 39 post di DB
isinya sama, tidak provide value ke audiens, merusak persepsi produk.

## Solution

Pisahkan pipeline konten jadi dua agent independen: **Agent Riset** (planning)
dan **Agent Konten** (eksekusi). Agent riset menghasilkan brief bebas format dari
data real, agent konten mengeksekusi berdasarkan brief tersebut.

## Architecture

```
                     Cron 1x/hari (pagi)
                         │
                    ┌────▼────┐
                    │Trend-   │  38 sources, geo=ID
                    │Pulse    │
                    └────┬────┘
                         │ raw trends
                    ┌────▼────┐
                    │Agent    │  Groq llama-3.3-70b
                    │Riset    │  → analisis bebas, bukan template
                    └────┬────┘
                         │ brief (text bebas)
                    ┌────▼────┐
                    │content_ │  tabel baru
                    │plans    │  status: pending | used
                    └────┬────┘
                         │
              ┌──────────┴──────────┐
              │                     │
    ┌─────────▼─────┐    ┌─────────▼─────┐
    │Cron generate  │    │/konten manual │
    │(via cron API) │    │(skip riset)   │
    └─────────┬─────┘    └─────────┬─────┘
              │                    │
         ┌────▼────┐         ┌────▼────┐
         │Agent    │         │Agent    │
         │Konten   │         │Konten   │
         └────┬────┘         └────┬────┘
              │                    │
         ┌────▼────┐         ┌────▼────┐
         │social_  │         │social_  │
         │posts    │         │posts    │
         └─────────┘         └─────────┘
```

## Database

### New table: `content_plans`

```sql
create table content_plans (
  id          uuid default gen_random_uuid() primary key,
  brief       text not null,
  status      text default 'pending' check (status in ('pending', 'used')),
  created_at  timestamptz default now(),
  used_at     timestamptz
);
```

### Existing: `social_posts`

Add column `content_plan_id` → FK to `content_plans.id`.

## Agent Riset

- **Trigger**: Cron 1x/hari (via `/api/cron/research` — endpoint baru)
- **Input**: Trend-Pulse data mentah (Google Trends, News, Reddit, Wikipedia)
- **LLM**: Groq llama-3.3-70b-versatile
- **Prompt**: Benar-benar analisis data, bukan template. Output bebas (narasi,
  poin-poin, pertanyaan, apapun). Tidak ada JSON kaku.
- **Error handling**: Kalau Trend-Pulse gagal atau LLM tidak bisa parse → SKIP,
  jangan generate fallback. Tidak ada hardcoded topics.
- **Output**: Simpan ke `content_plans.brief`, status `pending`

## Agent Konten

- **Trigger**: `/konten ig/tiktok [topik]` (manual) atau cron generate
- **Input**: Brief dari `content_plans` (pending teratas) atau topik dari user
- **LLM**: Groq llama-3.3-70b-versatile
- **Prompt**: Berdasarkan brief, buat konten dengan hook spesifik. DILARANG
  generalisasi — setiap konten harus angkat insight unik dari brief.
- **Output**: caption, card_title, card_description, hashtags → `social_posts`
- **QA**: OpenRouter → Groq fallback, auto-regen jika score < 4
- **Dedup**: Tetap jalan (bigram) untuk jaga-jaga

## Manual Mode

`/konten ig [topik]` tetap prioritas. Langsung ke Agent Konten dengan brief
berisi "topik dari user: [input]". Tidak perlu menunggu cron riset.

## Apa yang Tidak Berubah

- Trend-Pulse tetap pakai Python CLI
- QA review tetap OpenRouter → Groq
- Dedup tetap bigram + COMMON_WORDS
- Telegram delivery tetap sama
- Card image generation tetap sama

## Cron Endpoints

Dua cron endpoint terpisah:

1. **`/api/cron/generate-social-content`** (existing) — Agent Konten
   - Cek `content_plans` → ambil 1 pending → generate → save ke `social_posts`
   - Update `content_plans.status` → `used`
   - Kalau tidak ada pending → skip (log "no pending plans")
   - Trigger: tetap seperti sekarang (cron internal atau Vercel)

2. **`/api/cron/research`** (baru) — Agent Riset
   - Jalankan Trend-Pulse + Agent Riset → simpan ke `content_plans`
   - Trigger: 1x/hari pagi

## File Changes

- `lib/supabase/admin.ts` — mungkin perlu export tambahan
- `scripts/generate-social-content.ts` — dirombak total:
  - Pisah jadi mode `research` vs `generate` (via CLI arg `--mode=`)
  - `--mode=research`: Trend-Pulse → LLM riset → save `content_plans`
  - `--mode=generate`: Baca `content_plans` → Agent Konten → `social_posts`
  - Hapus hardcoded fallback topics
  - Hapus JSON template untuk output riset
  - Tambah FK `content_plan_id` di save ke `social_posts`
- `app/api/cron/generate-social-content/route.ts` — panggil `--mode=generate`
- `app/api/cron/research/route.ts` — baru, panggil `--mode=research`
- `app/api/telegram/webhook/route.ts` — `/konten` tetap panggil `--mode=generate` dengan topic user

## Success Criteria (Measurable & Trackable)

Semua metrics disimpan di tabel baru `content_metrics` dan bisa dicek via query
kapan saja.

### Tabel baru: `content_metrics`

```sql
create table content_metrics (
  id           uuid default gen_random_uuid() primary key,
  metric_date  date not null default current_date,
  metric_name  text not null,        -- kode metric (lihat bawah)
  metric_value numeric not null,
  metadata     jsonb default '{}',   -- detail tambahan
  created_at   timestamptz default now(),
  unique(metric_date, metric_name)
);
```

### Metric yang dicatat setiap hari (oleh cron atau di script generate):

| Kode | Metric | Cara Ukur | Target |
|------|--------|-----------|--------|
| `plans_created` | Jumlah `content_plans` dibuat hari ini | COUNT `content_plans` WHERE created_at = today | >= 1 |
| `plans_used` | Jumlah `content_plans` dipakai hari ini | COUNT WHERE used_at = today | >= 1 |
| `plans_age_hours` | Rata-rata umur pending plan sebelum dipakai | AVG(used_at - created_at) dalam jam | <= 48 |
| `posts_created` | Jumlah `social_posts` dibuat hari ini | COUNT `social_posts` WHERE created_at = today | >= 1 |
| `qa_avg_score` | Rata-rata QA score hari ini | AVG dari hasil reviewContent() | >= 4 |
| `qa_regen_rate` | Persentase konten yang perlu regenerasi | COUNT(skor<4) / COUNT(total) | <= 25% |
| `qa_fallback_rate` | Persentase QA yang fallback ke Groq | COUNT(fallback) / COUNT(total) | <= 10% |
| `bigram_dedup_hit` | Jumlah konten kena dedup (false positive?) | COUNT dari log dedup | <= 1 |
| `unique_content_phrases` | Jumlah bigram unik NON-COMMON_WORDS dari semua konten 7 hari terakhir | Distinct bigrams dari `social_posts.topics` | Naik tiap minggu |
| `template_ratio` | Persentase topik mengandung kata "optimalkan/maksimalkan" | LIKE query | <= 20% |

### Verifikasi

Setiap akhir minggu, jalankan query:
```sql
-- Cek template_ratio
SELECT COUNT(*) FILTER (
  WHERE topics::text ILIKE '%optimalkan%' OR topics::text ILIKE '%maksimalkan%'
) * 100.0 / NULLIF(COUNT(*), 0) as template_pct
FROM social_posts
WHERE created_at >= now() - interval '7 days';

-- Cek unique bigrams diversity
SELECT COUNT(DISTINCT unnest) as unique_phrases FROM social_posts,
  LATERAL (
    SELECT regexp_split_to_table(lower(regexp_replace(topics::text, '[^a-z0-9 ]', '', 'g')), ' ')
  ) words(word)
WHERE word != '' AND word NOT IN ('barbershop','digital','manajemen','antrian','kapster','tips','cara','dengan','yang','untuk','dari','ini','agar','biar','saat','tanpa','lebih','bikin','bisa','supaya','indonesia','online','bisnis','meningkatkan','pendapatan','teknologi','waktu','mengoptimalkan','pengelolaan','mengelola','membantu','memaksimalkan')
AND char_length(word) > 3;
```

### Accountability

Semua metric di atas disimpan di database. CEO (kamu) bisa cek kapan saja via:
- Query langsung ke Supabase
- Dashboard (jika ada nanti)
- Report mingguan

Kalau `template_ratio > 20%` atau `qa_avg_score < 4` selama 3 hari berturut-turut,
sistem WAJIB:
1. Log peringatan ke file
2. Kirim notifikasi ke Telegram admin
3. (FUTURE) Trigger auto-retrain prompt

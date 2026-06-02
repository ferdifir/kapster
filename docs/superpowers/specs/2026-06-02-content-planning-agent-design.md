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

- **Trigger**: Cron 1x/hari (via `/api/cron/generate-social-content`)
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

## Success Criteria

1. Agent riset bisa jalan sendiri via cron tanpa generate konten
2. Agent konten bisa baca `content_plans` dan eksekusi pending brief
3. Manual `/konten ig` tetap jalan tanpa perlu cron riset
4. Setelah 5 hari: topik yang dihasilkan minimal 4 angle berbeda
   (tidak semua "optimalkan X")
5. QA score rata-rata >= 4

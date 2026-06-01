# Social Content Generation — Design Spec

## Overview
Generate daily Instagram & TikTok copywriting content (caption only) for @kapster.myid (IG) and @kapster.my.id (TikTok), with trend analysis and Telegram-based review workflow.

## Pipeline
```
06:00 WIB — Cron trigger → scripts/generate-social-content.ts
  Phase 1: Trend Research (web search + Groq)
  Phase 2: Content Selection (3-4 topik, variasi content pillar)
  Phase 3: Copy Generation (caption + hashtags per konten)
  Phase 4: Telegram Delivery (review oleh user)
  Phase 5: Save to social_posts DB
  User: copy-paste manual ke IG/TikTok
```

## Database
Tabel `social_posts`:

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | PK, `gen_random_uuid()` |
| `platform` | TEXT | `instagram`, `tiktok`, `both` |
| `caption` | TEXT | Full caption copy |
| `topics` | TEXT[] | Tags/topik terkait |
| `content_type` | TEXT | `educational`, `solution`, `social_proof` |
| `trend_analysis` | JSONB | Source, keywords, relevance score |
| `status` | TEXT | `draft`, `sent_to_telegram`, `posted_ig`, `posted_tt` |
| `telegram_msg_id` | INTEGER | Untuk track review |
| `scheduled_date` | DATE | Tanggal konten ini dibuat |
| `created_at` | TIMESTAMPTZ | `NOW()` |
| `updated_at` | TIMESTAMPTZ | `NOW()` |

## Script: `scripts/generate-social-content.ts`

### Phase 1: Trend Research
- Panggil Groq (`llama-3.3-70b-versatile`) dengan prompt: cari 5 topik barbershop trending di Indonesia hari ini, dengan sumber referensi dan reasoning
- Tidak perlu MCP server — Groq langsung generate topik berdasarkan knowledge + web search bawaan Groq

### Phase 2: Content Selection
- Groq pilih 3-4 topik, pastikan variasi content pillar (edu/solusi/social)
- Assign platform target per konten

### Phase 3: Copy Generation
- Groq generate caption per konten (150-300 kata)
- Struktur caption: hook → body → CTA
- Sertakan: 10-15 hashtag relevan, platform target, content pillar
- Output format JSON array per konten

### Phase 4: Telegram Delivery
- Kirim ke `TELEGRAM_CHAT_ID` yang sudah ada
- Format per konten:
  ```
  📱 [PLATFORM] | [PILLAR]
  ─────────────────
  [caption lengkap]
  ─────────────────
  🔍 Tren: [insight singkat]
  ```

### Phase 5: Save to DB
- Insert batch ke `social_posts`
- Status: `sent_to_telegram`

## API Integration
- **Trend research:** Groq LLM + web search (MCP server existing)
- **No social media API needed** — posting manual oleh user
- **No image generation** — fokus copywriting

## Cron
- Tambah migrasi Supabase baru untuk cron job kedua
- Schedule: `06:00 WIB` setiap hari (23:00 UTC previous day)
- Trigger: `POST /api/cron/generate-social-content`
- Route: `app/api/cron/generate-social-content/route.ts` — reuse pola auth dari blog cron
- Script dipanggil via `npx tsx scripts/generate-social-content.ts`

## Content Guidelines
- Hook: pain point, angka, pertanyaan, atau statement kontroversial
- Body: value-driven, edukasi, atau bukti sosial
- CTA: "Coba gratis", "Download sekarang", "Link di bio"
- Panjang caption: 150-300 kata (IG), 100-200 karakter (TikTok)
- Hashtag: 10-15 relevan, mix broad + specific
- Bahasa: Indonesia, gaya ngobrol santai tapi profesional
- Content pillar mix: 35% edukasi, 50% solusi, 15% social proof

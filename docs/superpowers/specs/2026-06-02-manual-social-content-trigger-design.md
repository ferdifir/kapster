# Manual Social Content Trigger — Design Spec

## Overview
Manual trigger dari Telegram untuk generate 1 konten sosial media (Instagram/TikTok) dengan opsi topik kustom atau biarkan LLM menentukan.

## Command
```
/konten [ig|tiktok] [opsional: topik bebas]
```

Contoh:
- `/konten ig` → LLM riset + generate 1 konten Instagram
- `/konten tiktok` → LLM riset + generate 1 konten TikTok
- `/konten ig cara hitung komisi kapster` → topik spesifik
- `/konten` → bot reply "Gunakan: /konten [ig|tiktok] [opsional: topik]"

## Flow
1. User kirim `/konten ig [topik]` ke bot Telegram
2. Webhook detect command → balas `"⏳ Lagi nulis konten Instagram..."` (respons < 2 detik)
3. Spawn `npx tsx scripts/generate-social-content.ts --platform=instagram --topic="..."` — async
4. Script jalan: trend research → copy gen → card image → Telegram langsung ke chat user
5. Zero state, zero multi-step, zero race condition

## Perubahan pada `scripts/generate-social-content.ts`

### CLI Args
- `--platform` (required): `instagram` atau `tiktok`
- `--topic` (optional): topik spesifik dari user. Jika tidak ada, LLM tentukan sendiri.

### Pillar System (Revisi)
**Before:** 3 pillar (educational, solution, social_proof) + persentase 35/50/15 dipaksakan per batch.

**After:** 2 pillar aman — LLM pilih berdasarkan topik:
- `educational` — tips, edukasi, cara mengelola barbershop
- `solution` — solusi masalah barbershop, relevansi Kapster

**`social_proof` dihapus total** — tanpa data testimoni riil, LLM bisa halusinasi dan berbahaya secara hukum.

### Prompt Revisions

**Trend Research Prompt:**
- Hanya generate 1-2 ide topik (bukan 5)
- Jika user memberikan `--topic`, skip trend research dan langsung ke copy gen
- Hapus persentase pillar — pillar adalah strategi akun, bukan per-post

**Copy Generation Prompt:**
- Gunakan **PAS formula** (Problem → Agitation → Solution) atau **AIDA**
- Title/hook max ~10 kata (sesuai format `htmlcontent.html`)
- Description satu baris max 100 karakter
- Platform sudah ditentukan user (ig/tiktok), LLM tidak perlu memilih
- Bahasa Indonesia santai, natural, ngobrol
- 5-8 hashtag relevan (tidak lebih)
- Integrasi Kapster natural, jangan hard-sell

### Card Image
- Title (hook) max ~10 kata
- Description satu baris
- Platform badge sesuai pilihan user
- Handle dari env (`SOCIAL_IG_USERNAME` / `SOCIAL_TT_USERNAME`)
- struktur mengikuti `htmlcontent.html`

### Output
1 item saja (bukan 4 seperti cron). Langsung:
1. Save ke DB (`social_posts`)
2. Generate card image (satori + resvg)
3. Upload ke Supabase Storage
4. Kirim ke Telegram (photo + caption + inline buttons)

## Perubahan pada `app/api/telegram/webhook/route.ts`

### New Handler
```typescript
if (body.message?.text?.startsWith("/konten")) {
  // Parse: /konten ig [topik] or /konten tiktok [topik]
  // Respond with "⏳ Generating..."
  // Spawn child process with args
  // Return 200 immediately
}
```

## Perubahan Database
Tidak ada. Schema `social_posts` sudah cukup — kolom `platform` bisa `instagram` | `tiktok`.

## Files Changed
| File | Perubahan |
|------|-----------|
| `scripts/generate-social-content.ts` | CLI args, 2 pillar, prompt revisi, 1 item |
| `app/api/telegram/webhook/route.ts` | Handler `/konten` command |

## Tidak Berubah
- Cron tetap jalan 06:00 WIB (generate 4 item, mixed pillar)
- Inline buttons status tracking (posted_ig/posted_tt/draft)
- Reply-to-save-post-url flow
- Card image generator (`generate-card-image.tsx`)
- Telegram lib (`lib/telegram.ts`)

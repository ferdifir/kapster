# Kapster

Queue management SaaS untuk barbershop. Mengelola antrian, booking, barber, dan notifikasi WhatsApp.

## Fitur

- **Antrian Real-time** — Pelanggan join via link, lihat posisi langsung
- **Booking** — Reservasi jadwal, konfirmasi otomatis
- **Manajemen Barber** — Assignment, status, pergantian shift
- **Notifikasi WhatsApp** — OTP, reminder, notifikasi antrian
- **Dashboard** — Statistik harian, grafik, data analytics
- **Display TV** — Tampilan antrian di layar monitor
- **Multi-cabang** — Dukungan multiple barbershop (Enterprise)
- **Referral / Affiliate** — Program komisi untuk referrer
- **Blog & SEO** — Blog generator otomatis dengan AI

## Tech Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 16 (App Router) |
| Database | Supabase (PostgreSQL + Realtime) |
| Auth | Supabase Auth (email, magic link) |
| Payment | Pakasir (QRIS, VA) |
| WA Gateway | WuzAPI |
| AI | Groq (Llama), Ollama |
| Deployment | VPS (PM2) + GitHub Actions |

## Development

```bash
npm install
npm run dev
```

Buka [http://localhost:3003](http://localhost:3003).

### Scripts

| Script | Keterangan |
|---|---|
| `npm run dev` | Dev server port 3003 |
| `npm run build` | Build production (webpack) |
| `npm run start` | Start production |
| `npm run lint` | ESLint |
| `npm run test:e2e` | Playwright E2E tests |

## Environment

Salin `.env.example` ke `.env.local` dan isi:

| Variable | Keterangan |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role |
| `NEXT_PUBLIC_BASE_URL` | Base URL (https://kapster.my.id) |
| `NEXT_PUBLIC_PAKASIR_API_KEY` | Pakasir publishable key |
| `PAKASIR_SECRET_KEY` | Pakasir secret key |
| `SYSTEM_WUZAPI_TOKEN` | WuzAPI token untuk sistem |
| `GROQ_API_KEY` | Groq API key untuk AI |

## Deployment

CI/CD via GitHub Actions. Push ke `main` → build + deploy ke VPS.

```bash
pm2 start ecosystem.config.js
```

# Kapster SaaS — Implementation Plan

## Architecture Overview

```
Landing Page (Next.js — done)
        ↓
Dashboard App (Next.js, same repo — /app/dashboard/*)
        ↓
Supabase (Auth + DB + Realtime + Edge Functions + Storage)
        ↓
3rd Party: Midtrans (payment) + Fonnte (WhatsApp API)
```

---

## User Roles

| Role | Access |
|------|--------|
| `owner` | Full dashboard, billing, barber management |
| `barber` | Own queue + customer list |
| `customer` | Public queue page, booking form |
| `superadmin` | Platform-level admin |

---

## Database Schema

```
auth.users (Supabase built-in)
    ↓ 1:1
profiles (id, full_name, phone, role, avatar_url)

profiles (owner)
    ↓ 1:many
barbershops (id, slug, name, address, logo_url, plan, wa_number, settings_json)

barbershops
    ↓ 1:many
barbers (id, barbershop_id, profile_id, display_name, is_active)
services (id, barbershop_id, name, price, duration_min)
queues (id, barbershop_id, date, is_open)
bookings (id, barbershop_id, barber_id, service_id, customer_name, phone, scheduled_at, status)

queues
    ↓ 1:many
queue_entries (id, queue_id, barber_id, service_id, customer_name, phone,
               number, status, joined_at, called_at, done_at)

subscriptions (id, barbershop_id, plan, status, midtrans_id,
               period_start, period_end, max_barbers, max_queue_per_day)

analytics_daily (id, barbershop_id, date, total_customers, avg_wait_min, revenue, barber_stats_json)
```

### queue_entries.status values
- `waiting` — in queue
- `called` — dipanggil (giliran hampir tiba)
- `serving` — sedang dilayani
- `done` — selesai
- `skip` — tidak hadir

### subscriptions.plan values
- `starter` — Free: 1 barber, 20 antrian/hari
- `pro` — Rp99K/bulan: 5 barbers, unlimited antrian
- `enterprise` — Rp249K/bulan: unlimited barbers, multi-cabang

---

## Pages / Routes

```
/                          ← landing page (DONE)

/auth/login
/auth/register
/auth/callback             ← Supabase OAuth callback

/onboarding                ← setup barbershop after first register

/dashboard                 ← owner: overview stats
/dashboard/queue           ← live queue management (realtime)
/dashboard/bookings        ← booking list + approve/reject
/dashboard/barbers         ← manage barbers + invite link
/dashboard/services        ← manage layanan + harga
/dashboard/analytics       ← laporan harian/mingguan/bulanan
/dashboard/settings        ← barbershop profile, WhatsApp config
/dashboard/billing         ← subscription + upgrade plan

/barber                    ← barber PWA (mobile-first, serve own queue)

/q/[slug]                  ← PUBLIC: customer join queue page
/q/[slug]/status/[id]      ← PUBLIC: customer track own position (realtime)
/booking/[slug]            ← PUBLIC: customer booking form

/display/[slug]            ← TV monitor mode (fullscreen, public)
```

---

## Supabase Features

| Feature | Use Case |
|---------|----------|
| **Auth** | Email + Google OAuth, role via `profiles` |
| **PostgreSQL + RLS** | Data isolation per barbershop |
| **Realtime** | Live queue position updates (`queue_entries` table) |
| **Edge Functions** | WhatsApp notifications via Fonnte API |
| **Storage** | Logo, avatar upload |
| **pg_cron** | Daily analytics aggregation, auto-reset queue |

---

## RLS Policy Design

```
profiles:         user reads/writes own row only
barbershops:      owner CRUD | public SELECT (name, slug, logo only)
barbers:          owner CRUD | barber reads own row
services:         owner CRUD | public SELECT
queues:           owner CRUD | barber SELECT
queue_entries:    owner CRUD | barber UPDATE (own entries) | public SELECT (non-sensitive cols)
bookings:         owner CRUD | barber SELECT (own)
subscriptions:    owner SELECT | service role writes
analytics_daily:  owner SELECT | service role writes
```

---

## 3rd Party Integrations

| Service | Purpose | Notes |
|---------|---------|-------|
| **Midtrans** | Subscription payment | VA/QRIS/CC, #1 Indonesia |
| **Fonnte** | WhatsApp notifications | Murah, WhatsApp Business API |

---

## Implementation Phases

### Phase 1 — Foundation (Week 1–2)
- [x] Landing page (Next.js) — **DONE**
- [ ] Supabase project + schema migrations
- [ ] Row Level Security (RLS) policies
- [ ] Auth pages: `/auth/login`, `/auth/register`, `/auth/callback`
- [ ] Middleware: protect `/dashboard/*` and `/barber/*`
- [ ] Onboarding wizard: `/onboarding`
- [ ] Dashboard layout shell + sidebar navigation

### Phase 2 — Core Queue System (Week 3–4)
- [ ] Queue management page (`/dashboard/queue`)
- [ ] Barber assignment + service selection
- [ ] Public customer page (`/q/[slug]`) — join queue form
- [ ] Realtime queue position tracker (`/q/[slug]/status/[id]`)
- [ ] Barber PWA (`/barber`) — call next, mark done
- [ ] Starter plan limit enforcement (1 barber, 20/day)

### Phase 3 — Features (Week 5–6)
- [ ] Booking & reservasi system
- [ ] Dashboard bookings management
- [ ] WhatsApp notifications (Edge Function → Fonnte)
- [ ] TV Display mode (`/display/[slug]`)
- [ ] Analytics dashboard (charts, revenue, customer stats)
- [ ] Analytics aggregation via pg_cron

### Phase 4 — Business Layer (Week 7–8)
- [ ] Subscription gating (enforce per-plan limits)
- [ ] Midtrans payment integration (webhook + Edge Function)
- [ ] Billing dashboard (`/dashboard/billing`)
- [ ] Multi-branch support (Enterprise)
- [ ] Public API endpoints (Enterprise)
- [ ] Invite link for barbers

---

## Development Conventions

- All Supabase migrations in `supabase/migrations/`
- Use `@supabase/ssr` for Next.js server-side auth (cookies, not localStorage)
- Supabase client: `createServerClient` in server components, `createBrowserClient` in client components
- All DB calls go through typed Supabase client (generate types with `supabase gen types`)
- Realtime subscriptions only in client components (`"use client"`)
- Edge Functions in `supabase/functions/`

---

## Current Status

**Phase 1 — IN PROGRESS**

Last updated: 2026-05-15

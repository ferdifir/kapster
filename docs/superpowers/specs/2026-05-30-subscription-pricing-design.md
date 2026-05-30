# Subscription & Pricing Design — Kapster

**Date:** 2026-05-30
**Status:** Approved
**Pricing:** Rp10.000/month (flat, single plan, no free tier)

---

## Overview

Kapster transitions from 100% free to a paid SaaS model. New users must pay Rp10.000/month immediately after registration (no trial). The app uses Pakasir (Indonesian payment link service) as the payment gateway.

---

## Database

### Enum: `subscription_status`
- `active` — subscription is within valid period
- `cancelled` — user cancelled but period still active (no auto-renew)
- `expired` — period has ended

### Enum: `payment_status`
- `pending` — payment created, waiting for confirmation
- `completed` — payment successful
- `failed` — payment failed/declined
- `expired` — payment link expired unpaid

### Table: `subscriptions`

| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| barbershop_id | UUID FK → barbershops.id | UNIQUE (one active subscription per shop) |
| status | subscription_status | |
| current_period_start | timestamptz | When the current billing period started |
| current_period_end | timestamptz | Exactly 30 days from period_start (including hours) |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### Table: `payments`

| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| barbershop_id | UUID FK → barbershops.id | |
| subscription_id | UUID FK → subscriptions.id | nullable |
| pakasir_order_id | text UNIQUE | Order ID sent to Pakasir |
| amount | numeric | Always 10000 |
| status | payment_status | |
| payment_method | text | nullable, e.g. 'qris', 'bri_va' |
| paid_at | timestamptz | nullable |
| created_at | timestamptz | |

---

## Flow

### Registration → Payment → Dashboard

1. **Register** — email + password + WhatsApp OTP (existing flow, unchanged)
2. **Onboarding** — create barbershop (name, slug, address, WA number) (existing flow, unchanged)
3. **Billing Page** → `/billing` (public route, outside dashboard):
   - No subscription → show "Aktifkan Langganan Rp10.000/bulan"
   - Button: "Bayar Rp10.000 Sekarang"
   - Click → create `payments` row (pending) → generate Pakasir URL → redirect user
4. **Pakasir Payment** → user pays via QRIS/VA on `app.pakasir.com/pay/...`
5. **Webhook** → POST to `/api/webhook/pakasir`:
   - Validate `order_id` and `amount` match our `payments` record
   - Update payment status → `completed`
   - Upsert `subscriptions` → status `active`, `current_period_start = now()`, `current_period_end = now() + interval '30 days'`
6. **Redirect** → user returns to dashboard (active)

### Cancel Subscription

- Cancel button is on the **main dashboard page** (`/dashboard`) when subscription is active — shown as a card or option.
- Click → confirmation dialog: "Langganan tetap aktif sampai {period_end}. Setelah itu tidak bisa akses dashboard."
- Sets `subscriptions.status = 'cancelled'`
- User stays logged in with full access until period_end
- After period_end passes → status becomes `expired` → redirect to `/billing`

### Renewal (after expiry)

- User on `/billing` with expired status
- Button: "Bayar Lagi Rp10.000"
- Same flow as initial payment (new 30-day period)

### Auto-Expire Check

- Every time a user accesses `/dashboard/*` or `/barber/*`:
  - If subscription status is `active` or `cancelled` AND `current_period_end < now()`:
    - Update status to `expired`
    - Redirect to `/billing`

### Route Protection

- All `/dashboard/*` and `/barber/*` routes check for active subscription.
- `/billing` is a **public route** (no auth barrier, no subscription check) — accessible to anyone.
- No subscription or expired/cancelled beyond period → redirect to `/billing`.

---

## Landing Page Changes

### PricingSection Component
- Single pricing card (no plan name, no tiers)
- Price: **Rp10.000** / bulan
- Features list: queue management, online booking, WhatsApp notifications, barber & service management, analytics dashboard, TV monitor display, barbershop map directory
- CTA: "Mulai Sekarang" → `/auth/register`
- Subtitle: "Rp10.000/bulan — cancel kapan saja"

### JSON-LD Structured Data (in `app/layout.tsx`)
- Update `offers.price` from `"0"` to `"10000"`
- `offers.priceCurrency` stays `"IDR"`
- Consider changing offer type to `Subscription` with `billingDuration: "P1M"`

---

## API / Webhook

### Endpoint: `POST /api/webhook/pakasir`

Receives from Pakasir:
```json
{
  "amount": 10000,
  "order_id": "INV-...",
  "project": "kapster",
  "status": "completed",
  "payment_method": "qris",
  "completed_at": "2026-05-30T..."
}
```

Actions:
1. Look up `payments` by `pakasir_order_id`
2. Validate amount matches
3. Update payment: status = `completed`, `payment_method`, `paid_at`
4. Upsert subscription: status = `active`, period_start = now, period_end = now + 30 days
5. Return 200 OK

### Payment Creation (used by billing page)

Generate unique `pakasir_order_id` (e.g. `KAP-{barbershop_id}-{timestamp}`)
Redirect user to: `https://app.pakasir.com/pay/kapster/10000?order_id={order_id}&redirect={callback_url}`

---

## Environment Variables

Already present in `.env.local`:
- `PAKASIR_API_KEY=xSFW8nqiUENWX5dvCgDGaXW1Gt5CkWw8`
- `PAKASIR_PROJECT_SLUG=kapster`
- `NEXT_PUBLIC_BASE_URL=https://kapster.my.id` — used as redirect base after payment

May need to add:
- `PAKASIR_WEBHOOK_SECRET` (if needed for webhook verification)

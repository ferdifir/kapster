# Referral / Affiliate System Design

## Business Context

- Subscription: Rp10.000/month per barbershop (flat)
- Payment gateway: Pakasir (est. ~Rp2.000/tx fee)
- Fixed cost: Rp60.000/month (VPS)
- Status: Pre-launch (0 active barbershops)
- Goal: Acquisition strategy from zero with sustainable unit economics

## Incentive Structure (Approved: Pendekatan 2)

| Item | Amount |
|---|---|
| Barbershop discount (first month) | 25% → pays Rp7.500 |
| Referrer commission (one-time) | Rp3.500 (35% of normal price) |
| Minimum withdrawal | Rp25.000 |
| Cookie duration | 45 days |

### Unit Economics per Referred Shop

| Period | Revenue | Pakasir | Commission | Kapster |
|---|---|---|---|---|
| Month 1 | Rp7.500 | (Rp2.000) | (Rp3.500) | **Rp2.000** |
| Month 2+ | Rp10.000 | (Rp2.000) | Rp0 | **Rp8.000** |

## Referral Flow

1. User has account → gets unique referral link: `kapster.my.id?ref=CODE`
2. User shares link with prospective barbershop
3. Prospect clicks link → cookie `referrer_code` set (45-day expiry)
4. Prospect registers (immediately or days later) → system reads cookie → referral recorded
5. Barbershop activates subscription (pays Rp7.500 via Pakasir)
6. First payment succeeds → commission Rp3.500 credited to referrer's balance
7. Referrer views balance at `/dashboard/referrals`, can withdraw when ≥ Rp25.000

## Database Schema

### `referral_codes`
Unique referral code per user (auto-generated, e.g. "FERDI-TOKO").

| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| user_id | UUID FK → profiles.id | UNIQUE |
| code | TEXT | UNIQUE, generated |
| created_at | TIMESTAMPTZ | |

### `referrals`
Tracks each barbershop that was referred.

| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| referrer_id | UUID FK → profiles.id | |
| barbershop_id | UUID FK → barbershops.id | UNIQUE |
| status | ENUM: pending/earned/paid | pending=registered, earned=paid first month |
| commission | INTEGER | 3500 |
| earned_at | TIMESTAMPTZ? | Set when webhook confirms first payment |
| paid_at | TIMESTAMPTZ? | Set when commission is withdrawn |
| created_at | TIMESTAMPTZ | |

### `referral_balances`
Aggregated balance per referrer.

| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| user_id | UUID FK → profiles.id | UNIQUE |
| balance | INTEGER | Default 0, withdrawable |
| total_earned | INTEGER | Default 0, lifetime earnings |
| total_withdrawn | INTEGER | Default 0 |
| updated_at | TIMESTAMPTZ | |

### `payout_requests`
Withdrawal requests.

| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| user_id | UUID FK → profiles.id | |
| amount | INTEGER | Min 25000 |
| method | TEXT? | 'bank_transfer', 'subscription_offset' |
| bank_info | JSONB? | { bank, account, name } |
| status | ENUM: pending/paid/cancelled | |
| notes | TEXT? | Admin notes |
| requested_at | TIMESTAMPTZ | |
| paid_at | TIMESTAMPTZ? | |

## Cookie Tracking

- **Set:** Client-side (middleware or layout) reads `?ref=CODE` from URL → sets cookie `referrer_code` = CODE, max-age 45 days
- **Read:** During barbershop signup/onboarding, check cookie → resolve code to user_id → create `referrals` record (pending)
- **Edge cases:**
  - Multiple clicks: last referrer wins (cookie overwrites)
  - No cookie: organic signup, no referral
  - Cookie expired: treated as organic

## Commission Payout

**Two methods:**

| Method | Who | How |
|---|---|---|
| Bank transfer | Non-barbershop referrers | Admin manually transfers after request |
| Subscription offset | Barbershop owners | Commission applied as credit to next subscription |

**Flow:** User requests withdrawal at `/dashboard/referrals` → admin reviews at `/admin/referrals` → processes manually → updates status.

## UI Pages

### `/dashboard/referrals` — Referrer Earnings Page
- Referral link display + copy button
- Stats: people referred, commissions earned, current balance
- Referral list (shop name, status, date)
- "Tarik Saldo" button (active when balance ≥ Rp25.000)
- Withdrawal history

### Registration Page (existing signup flow)
- Client-side check for `referrer_code` cookie
- If present: show banner "Kamu diundang oleh [nama] — diskon 25% bulan pertama!"
- Hidden field passes referral code to server on submit

### Withdrawal Modal
- Method selection: Transfer Bank / Potong Subscription
- Bank method: bank name, account number, account holder
- Submit → creates `payout_requests` record

### `/admin/referrals` — Admin Page
- List all payout requests with status
- Mark as paid / cancel
- Overview: total referrals, total commissions paid, pending requests

## Integration Points

### Existing Code to Modify

1. **Pakasir webhook** (`app/api/webhook/pakasir/route.ts`): After payment is completed and subscription is activated, check if barbershop has a pending referral → update referral status to `earned`, increment `referral_balances.balance`.

2. **Subscription activation** (`lib/subscription.ts`): When applying subscription offset (barbershop referrer), calculate remaining balance after credit.

3. **Client layout** (layout.tsx or middleware): Add cookie-setting logic for `?ref=` parameter.

4. **Barbershop signup** (onboarding flow): Add cookie check and referral code collection.

### Anti-Abuse

- Self-referral: Check that referrer_id ≠ barbershop owner_id
- One commission per barbershop (UNIQUE constraint on referrals.barbershop_id)
- Commission only after PAID first month (not just registration)
- Payouts require admin approval

# Referral / Affiliate System Design

## Business Context

- Subscription: Rp10.000/month per barbershop (flat)
- Payment gateway: **Pakasir** — QRIS: 0.7% + Rp310 (< Rp105k), VA BRI/BNI: Rp3.500 flat
- Most common method: QRIS (fee = Rp380 for Rp10k, Rp363 for Rp7.5k)
- Fixed cost: Rp60.000/month (VPS)
- Status: Pre-launch (0 active barbershops)
- Goal: Acquisition strategy from zero with sustainable unit economics

## Incentive Structure

| Item | Amount |
|---|---|
| Barbershop discount (first month) | 25% → pays Rp7.500 |
| Referrer commission (one-time) | Rp3.500 (35% of normal price) |
| Minimum withdrawal | Rp25.000 |
| Cookie duration | 45 days |
| Referrer auth | Token di URL (magic link via WA) |

### Unit Economics per Referred Shop (QRIS)

| Period | Revenue | Pakasir | Commission | Kapster |
|---|---|---|---|---|
| Month 1 | Rp7.500 | (Rp363) | (Rp3.500) | **Rp3.637** |
| Month 2+ | Rp10.000 | (Rp380) | Rp0 | **Rp9.620** |

VPS break-even: ~17 referred shops in month 1.

## Referrer Account Model

**Two types of referrers:**

| Type | Authentication | Referral Link | Track Performance |
|---|---|---|---|
| Barbershop owner (has profile) | Login via existing auth (Supabase) | Ada di `/dashboard/referrals` | Di dashboard yang sama |
| Lightweight referrer (no auth) | Token di URL (magic link via WA) | Dikirim via WA saat daftar | `kapster.my.id/referral/CODE?t=TOKEN` |

## Referral Flow

### Barbershop Owner
1. Owner login → buka `/dashboard/referrals` → dapat link `kapster.my.id?ref=NAMA-TOKO`
2. Share link ke calon barbershop
3. Calon daftar (cookie 45 hari) → referral tercatat
4. Barbershop bayar pertama → komisi Rp3.500 cair ke saldo
5. Owner bisa tarik saldo (cash atau offset subscription)

### Lightweight Referrer
1. Buka `kapster.my.id/referral/daftar` → isi nama + WA
2. Sistem buat `referral_codes` + generate `access_token`
3. WA otomatis dikirim: *"Link referral kamu: kapster.my.id?ref=ANTO. Pantau performa: kapster.my.id/referral/ANTO?t=abc123"*
4. Share link → seperti flow di atas
5. Buka link performa kapan saja via bookmark
6. Minta payout via form di halaman performa → admin proses manual via WA

## Database Schema

### `referral_codes`
Sumber semua referrer — baik yang punya akun maupun lightweight.

| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| profile_id | UUID? | FK → profiles.id (NULL untuk lightweight) |
| name | TEXT? | Nama referrer (lightweight) |
| wa_number | TEXT? | WA referrer (lightweight) |
| code | TEXT | UNIQUE, auto-generated (e.g. "FERDI-TOKO", "ANTO") |
| access_token | TEXT | UNIQUE, random UUID — untuk akses halaman performa |
| balance | INTEGER | Default 0 |
| total_earned | INTEGER | Default 0 |
| total_withdrawn | INTEGER | Default 0 |
| created_at | TIMESTAMPTZ | |

### `referrals`
Setiap barbershop yang didaftarkan via referral.

| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| referral_code_id | UUID FK → referral_codes.id | |
| barbershop_id | UUID FK → barbershops.id | UNIQUE |
| status | ENUM: pending/earned/paid | pending=registered, earned=paid first month |
| commission | INTEGER | 3500 |
| earned_at | TIMESTAMPTZ? | Set when webhook confirms first payment |
| paid_at | TIMESTAMPTZ? | Set when commission is withdrawn |
| created_at | TIMESTAMPTZ | |

### `payout_requests`

| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| referral_code_id | UUID FK → referral_codes.id | |
| amount | INTEGER | Min 25000 |
| method | TEXT? | 'bank_transfer', 'subscription_offset' |
| bank_info | JSONB? | { bank, account, name } |
| status | ENUM: pending/paid/cancelled | |
| notes | TEXT? | Admin notes |
| requested_at | TIMESTAMPTZ | |
| paid_at | TIMESTAMPTZ? | |

## Cookie Tracking

- **Set:** Client-side (middleware or layout) reads `?ref=CODE` from URL → sets cookie `referrer_code` = CODE, max-age 45 days
- **Read:** During barbershop signup/onboarding, check cookie → resolve code via `referral_codes` → create `referrals` record (pending)
- **Edge cases:**
  - Multiple clicks: last referrer wins (cookie overwrites)
  - No cookie: organic signup, no referral
  - Cookie expired: treated as organic
  - Klik link sekarang, daftar 3 minggu lagi → cookie masih aktif

## Commission Payout

| Method | Who | How |
|---|---|---|
| Bank transfer | Lightweight referrer | Admin transfer manual setelah request via WA |
| Subscription offset | Barbershop owner | Komisi jadi kredit untuk subscription bulan depan |

Flow: Referrer request di halaman performa → admin lihat di `/admin/referrals` → proses manual → update status.

## UI Pages

### `/referral/daftar` — Daftar Referrer (Lightweight)
- Form: Nama + Nomor WhatsApp
- Submit → create referral_codes → kirim WA dengan link referral + link performa
- Tampilkan link referral langsung di halaman (bisa copy)

### `/referral/[code]` — Halaman Performa Referrer
- Validasi `?t=TOKEN` cocok dengan `access_token` di DB
- Jika token valid: tampilkan dashboard referrer
- Jika tidak valid/tidak ada: redirect ke `/referral/daftar`
- Isi halaman:
  - Salam: "Halo [nama]!"
  - Link referral + tombol copy
  - Statistik: total diajak, pending, earned, saldo
  - Daftar referral (toko, status, komisi)
  - Tombol "Minta Tarik Saldo" (jika saldo ≥ Rp25.000)

### `/dashboard/referrals` — Halaman Pendapatan (Barbershop Owner)
- Sama seperti halaman performa referrer, tapi dalam dashboard existing
- Tambahan: opsi "Potong Subscription" saat tarik saldo

### Withdrawal Modal/Form
- Jumlah (auto-fill max dari balance)
- Metode: Transfer Bank / Potong Subscription
- Bank method: bank, nomor rekening, nama pemilik
- Submit → create payout_requests → muncul notifikasi

### `/admin/referrals` — Admin Page
- Overview: total referrals, total commissions paid, pending payout requests
- Daftar payout requests (filter by status)
- Tombol: Mark as paid / Cancel
- Form notes opsional

### Registration Page (existing barbershop signup)
- Client-side check cookie `referrer_code`
- Jika ada: banner "Kamu diundang oleh [nama referrer] — diskon 25% bulan pertama!"
- Hidden field: referral_code → dikirim ke server

## Integration Points

### Existing Code to Modify

1. **Pakasir webhook** (`app/api/webhook/pakasir/route.ts`): After payment is completed and subscription is activated, check if barbershop has a pending referral → update `referrals.status` to `earned`, increment `referral_codes.balance`.

2. **Subscription activation** (`lib/subscription.ts`): When subscription offset is applied (barbershop referrer), deduct from balance.

3. **Client layout** (middleware or root layout): Add cookie-setting logic for `?ref=CODE` parameter from URL.

4. **Barbershop signup/onboarding**: Add cookie check and referral code collection.

5. **WA notification**: Send referral link + access link via WhatsApp when lightweight referrer registers.

### Anti-Abuse

- Self-referral: Check that referrer profile_id ≠ barbershop owner_id
- One commission per barbershop (UNIQUE constraint on `referrals.barbershop_id`)
- Commission only after PAID first month (not just registration)
- Payouts require admin approval

# WuzAPI Integration Design — Kapster SaaS

**Date:** 2026-05-18
**Status:** Draft
**Author:** opencode

---

## Overview

Integrasi WhatsApp notification ke Kapster menggunakan WuzAPI (`wa.linkjo.my.id`) sebagai gateway WhatsApp. Setiap barbershop connect nomor WA sendiri via self-service pairing. Notifikasi dikirim secara decoupled melalui queue table + Edge Function agar tidak blocking proses utama.

---

## Architecture

```
Queue/Booking Event (Server Action)
    ↓
INSERT wa_notifications (status: pending)
    ↓
Supabase Realtime webhook (immediate) atau pg_cron (1 min fallback)
    ↓
Edge Function: wa-sender
    ↓
POST https://wa.linkjo.my.id/chat/send/text (barbershop token)
    ↓
UPDATE wa_notifications (status: sent/failed)
```

**Prinsip:** Fire-and-forget. Error WA tidak boleh menghambat proses antrian atau booking yang sedang berlangsung.

---

## Database Schema

### Table Baru: `wa_notifications`

```sql
CREATE TABLE wa_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id UUID REFERENCES barbershops(id) ON DELETE CASCADE,
  customer_phone TEXT NOT NULL,
  customer_name TEXT,
  event_type TEXT NOT NULL, -- 'join_queue' | 'queue_called' | 'queue_serving' | 'queue_done' | 'queue_number_update' | 'booking_confirmed' | 'booking_reminder'
  message_body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'sent' | 'failed' | 'retrying'
  wuzapi_message_id TEXT,
  error_message TEXT,
  retry_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ
);

CREATE INDEX idx_wa_notifications_pending ON wa_notifications(status, retry_count, created_at) WHERE status IN ('pending', 'retrying');
```

### Kolom Baru di `barbershops`

```sql
ALTER TABLE barbershops ADD COLUMN wuzapi_user_id INT;
ALTER TABLE barbershops ADD COLUMN wuzapi_token TEXT;
ALTER TABLE barbershops ADD COLUMN wa_connected BOOLEAN DEFAULT false;
ALTER TABLE barbershops ADD COLUMN wa_phone_number TEXT;
ALTER TABLE barbershops ADD COLUMN wa_pairing_code TEXT;
```

### RLS Policies

```sql
-- wa_notifications: owner barbershop bisa read, service role write
ALTER TABLE wa_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Barbershop owners can view their notifications"
  ON wa_notifications FOR SELECT
  USING (barbershop_id IN (
    SELECT id FROM barbershops WHERE owner_id = auth.uid()
  ));

CREATE POLICY "Service role can manage notifications"
  ON wa_notifications FOR ALL
  USING (true) WITH CHECK (true);
```

---

## Environment Variables

```
WUZAPI_URL=https://wa.linkjo.my.id
WUZAPI_ADMIN_TOKEN=14fa7c855278a677784fa71083012060
```

Ditambahkan ke `.env` dan `.env.local`.

---

## Notification Templates

| Event Type | Template |
|------------|----------|
| `join_queue` | `Halo {name}! Anda telah terdaftar di antrian *{barbershop}*. Nomor antrian: *#{number}*. Tanggal: {date}. Tunggu konfirmasi dari kami ya!` |
| `queue_called` | `Halo {name}, giliran Anda hampir tiba! Nomor antrian *#{number}* di *{barbershop}*. Mohon bersiap ya!` |
| `queue_serving` | `Halo {name}, Anda sekarang sedang dilayani di *{barbershop}* (#{number}). Terima kasih atas kesabarannya!` |
| `queue_done` | `Halo {name}, layanan Anda di *{barbershop}* telah selesai (#{number}). Terima kasih sudah berkunjung!` |
| `queue_number_update` | `Halo {name}, update antrian Anda di *{barbershop}*. Nomor: *#{number}*. Estimasi: {estimated}. Posisi Anda saat ini: {position} orang sebelum Anda.` |
| `booking_confirmed` | `Halo {name}, booking Anda di *{barbershop}* telah dikonfirmasi! 📅 {date}, ⏰ {time}. Layanan: {service}. Barber: {barber}. Sampai jumpa!` |
| `booking_reminder` | `Halo {name}, reminder: booking Anda di *{barbershop}* dalam 1 jam lagi. 📅 {date}, ⏰ {time}. Jangan sampai telat ya!` |

Placeholder yang tersedia: `{name}`, `{barbershop}`, `{number}`, `{date}`, `{time}`, `{estimated}`, `{position}`, `{service}`, `{barber}`.

---

## Event Triggers

| Event | Trigger Point | File |
|-------|--------------|------|
| `join_queue` | Setelah `queue_entries` INSERT | `app/q/[slug]/actions.ts` |
| `queue_called` | Status → `called` | `app/dashboard/queue/actions.ts` |
| `queue_serving` | Status → `serving` | `app/dashboard/queue/actions.ts` |
| `queue_done` | Status → `done` | `app/dashboard/queue/actions.ts` |
| `queue_number_update` | Nomor/posisi berubah | `app/dashboard/queue/actions.ts` |
| `booking_confirmed` | Setelah `bookings` INSERT | `app/booking/[slug]/actions.ts` |
| `booking_reminder` | 1 jam sebelum jadwal | `pg_cron` scheduled job |

Setiap trigger hanya melakukan **INSERT ke `wa_notifications`**. Tidak ada `await` ke WuzAPI. Proses utama tidak terpengaruh.

---

## Edge Function: `wa-sender`

**Lokasi:** `supabase/functions/wa-sender/index.ts`

**Trigger:** Dua metode (prioritas Realtime, fallback pg_cron):
1. **Supabase Realtime webhook** — setiap INSERT ke `wa_notifications` trigger Edge Function secara immediate
2. **pg_cron** — setiap 1 menit sebagai fallback kalau Realtime webhook gagal

### Logic

```
1. SELECT * FROM wa_notifications
   WHERE status IN ('pending', 'retrying')
   AND retry_count < 3
   ORDER BY created_at ASC
   LIMIT 10

2. For each notification:
   a. Fetch barbershop.wuzapi_token, barbershop.name
   b. If no token → mark 'failed', error: "WA not connected"
   c. POST to WUZAPI_URL/chat/send/text
      Headers: { Authorization: barbershop.wuzapi_token }
      Body: { Phone: customer_phone, Body: message_body }
   d. If 200 → UPDATE status='sent', wuzapi_message_id, sent_at
   e. If error → UPDATE retry_count++, status='retrying', error_message

3. Return summary: { processed, sent, failed }
```

### Idempotency

Jika `wuzapi_message_id` sudah terisi, skip notification. Mencegah double-send jika cron overlap.

---

## Retry Strategy

| Retry Count | Delay Before Next Attempt | Status |
|-------------|--------------------------|--------|
| 0 (first) | Immediate (next 10s poll) | `pending` |
| 1 | 30 detik | `retrying` |
| 2 | 2 menit | `retrying` |
| 3 | 5 menit | `retrying` |
| > 3 | Tidak retry | `failed` |

Delay diimplementasikan via `created_at + interval` check di query SELECT.

### Error Handling

| Error Type | Action |
|------------|--------|
| WuzAPI down / timeout | Retry dengan backoff |
| Barbershop disconnected (`wa_connected = false`) | Retry 1x, lalu `failed` |
| Invalid phone number (400) | Langsung `failed`, tidak retry |
| Rate limit (429) | Retry setelah delay dari `Retry-After` header |
| Network error | Retry dengan backoff |

---

## WhatsApp Connection Flow (Self-Service Pairing)

### 1. User klik "Connect WhatsApp" di `/dashboard/settings`

Server action memanggil WuzAPI admin:
```
POST /admin/users
Authorization: WUZAPI_ADMIN_TOKEN
Body: { name: "barbershop-{id}", token: "{random_32_char}" }
```

### 2. Simpan credentials ke DB

```sql
UPDATE barbershops
SET wuzapi_user_id = {response.id},
    wuzapi_token = {generated_token}
WHERE id = {barbershop_id}
```

### 3. User scan QR code

User diarahkan ke halaman `/dashboard/settings` → section WhatsApp → tampil QR code dari:
```
POST /session/connect
Authorization: {barbershop.wuzapi_token}
```

QR code diambil dari:
```
GET /session/qr
Authorization: {barbershop.wuzapi_token}
```

### 4. Verifikasi koneksi

Setelah scan, cek status:
```
GET /session/status
Authorization: {barbershop.wuzapi_token}
```

Jika `loggedIn = true`:
```sql
UPDATE barbershops
SET wa_connected = true,
    wa_phone_number = {jid_without_suffix}
WHERE id = {barbershop_id}
```

### 5. Disconnect / Reconnect

User bisa disconnect dan reconnect kapan saja dari settings.

---

## Disclaimer UI

Di `/dashboard/settings` section WhatsApp, sebelum tombol "Connect WhatsApp":

```
⚠️ Peringatan: Fitur ini menggunakan WhatsApp API tidak resmi (unofficial).
Resiko pemblokiran nomor WhatsApp ditanggung oleh pemilik barbershop.
Kami tidak bertanggung jawab atas nomor yang diblokir oleh WhatsApp.
Gunakan dengan bijak dan hindari pengiriman pesan spam.

[ ] Saya memahami resiko dan ingin melanjutkan
```

Checkbox harus dicentang sebelum tombol "Connect WhatsApp" aktif.

---

## pg_cron Jobs

### Job 1: Process pending notifications

```sql
SELECT cron.schedule(
  'wa-send-job',
  '* * * * *', -- every 1 minute (pg_cron minimum)
  $$
    SELECT net.http_post(
      url := current_setting('app.settings.edge_function_url') || '/functions/v1/wa-sender',
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || current_setting('app.settings.supabase_service_role_key')
      ),
      body := '{}'
    );
  $$
);
```

**Catatan:** pg_cron minimum interval 1 menit. Untuk processing lebih cepat (< 10 detik), alternatifnya gunakan Supabase Realtime webhook — setiap INSERT ke `wa_notifications` trigger Edge Function via database webhook. `pg_net` extension perlu di-enabled di Supabase project.

### Job 2: Booking reminders

```sql
SELECT cron.schedule(
  'wa-reminder-job',
  '*/5 * * * *', -- every 5 minutes
  $$
    INSERT INTO wa_notifications (barbershop_id, customer_phone, customer_name, event_type, message_body)
    SELECT
      b.id,
      bk.phone,
      bk.customer_name,
      'booking_reminder',
      -- render template
    FROM bookings bk
    JOIN barbershops b ON b.id = bk.barbershop_id
    WHERE bk.status = 'confirmed'
      AND bk.scheduled_at BETWEEN NOW() + INTERVAL '59 minutes' AND NOW() + INTERVAL '61 minutes'
      AND NOT EXISTS (
        SELECT 1 FROM wa_notifications wn
        WHERE wn.barbershop_id = b.id
          AND wn.customer_phone = bk.phone
          AND wn.event_type = 'booking_reminder'
          AND wn.created_at > NOW() - INTERVAL '2 hours'
      );
  $$
);
```

---

## Files to Create/Modify

### New Files
- `supabase/migrations/add_wa_notifications.sql` — migration untuk table + columns + RLS
- `supabase/migrations/add_wa_cron_jobs.sql` — pg_cron schedule
- `supabase/functions/wa-sender/index.ts` — Edge Function
- `lib/wuzapi.ts` — client helper untuk WuzAPI admin operations
- `lib/wa-templates.ts` — notification template renderer
- `app/dashboard/settings/wa-connect/actions.ts` — server actions untuk WA connection

### Modified Files
- `app/q/[slug]/actions.ts` — INSERT wa_notifications setelah joinQueue
- `app/dashboard/queue/actions.ts` — INSERT wa_notifications pada status changes
- `app/booking/[slug]/actions.ts` — INSERT wa_notifications setelah createBooking
- `components/dashboard/SettingsForm.tsx` — tambah section WhatsApp connection + disclaimer
- `lib/supabase/types.ts` — regenerate types setelah migration
- `.env` — tambah WUZAPI_URL dan WUZAPI_ADMIN_TOKEN
- `.env.local` — tambah WUZAPI_URL dan WUZAPI_ADMIN_TOKEN

---

## Implementation Phases

### Phase 1: Foundation
1. Migration: `wa_notifications` table + `barbershops` columns
2. RLS policies
3. Environment variables
4. `lib/wuzapi.ts` — admin client helper
5. `lib/wa-templates.ts` — template renderer

### Phase 2: Connection Flow
1. WhatsApp section di SettingsForm + disclaimer
2. Server actions: connect, get QR, check status, disconnect
3. QR display component

### Phase 3: Notification Triggers
1. `join_queue` trigger
2. `booking_confirmed` trigger
3. Queue status change triggers (called, serving, done, number_update)

### Phase 4: Edge Function & Cron
1. `wa-sender` Edge Function
2. pg_cron jobs (send + reminder)
3. Retry logic
4. Error handling

### Phase 5: Polish
1. Notification history di dashboard
2. Reconnect flow
3. Testing

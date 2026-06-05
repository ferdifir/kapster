# Demo Per-User Accounts

## Problem
Sistem demo saat ini menggunakan satu akun bersama (`demo@kapster.my.id`) dengan password dirotasi setiap kali ada request baru. Ini butuh waitlist karena hanya satu orang bisa pakai dalam satu waktu, dan password cycling via admin API rawan race condition.

## Solution
Setiap request demo mendapat akun Supabase Auth sendiri. Setelah sesi habis, akun dihapus permanent.

## Database Changes

### Drop `demo_waitlist`
Tabel `demo_waitlist` tidak lagi diperlukan karena tidak ada kontensi akun bersama.

### Modify `demo_sessions`
Tambah kolom:
- `auth_user_id UUID` — referensi ke `auth.users` untuk delete saat cleanup
- `email TEXT` — email yang digenerate untuk akun demo

Hapus index:
- `idx_demo_sessions_unique_active` — tidak diperlukan karena multiple sessions bisa berjalan bersamaan

## Flow

### Request Demo (WhatsApp → `handleDemoRequest`)
1. Extract text dari WhatsApp event, cek `"demo"`
2. Cek apakah `demo_sessions` sudah ada session **active** untuk nomor ini:
   - **Jika ada** → kirim ulang kredensial yang sama (email & password), jangan buat akun baru
   - **Jika tidak ada** → lanjut ke step 3
3. Loop retry (max 5x):
   a. Generate email `demo-{random8}@kapster.my.id`
   b. Generate password `Demo@{random12}`
   c. Panggil `supabase.auth.admin.createUser({ email, password, email_confirm: true })`
   d. Jika error duplicate email → retry dengan random baru
   e. Jika success → break
4. Insert `demo_sessions` dengan `auth_user_id`, `email`, `phone`, `temp_password`, `expires_at`
5. Kirim kredensial via WhatsApp

### Cleanup (Cron tiap 60 detik → `cleanupExpiredSessions`)
1. Query `demo_sessions` WHERE `status = 'active'` AND `expires_at < now()`
2. Untuk setiap session:
   a. `supabase.auth.admin.deleteUser(session.auth_user_id)` — hapus akun dari Auth
   b. Update `demo_sessions SET status = 'expired'`

## Files Changed
- `supabase/migrations/20260605000001_demo_per_user.sql` — migration baru
- `lib/demo.ts` — rewrite: hapus waitlist, tambah create/delete user + retry
- `app/api/cron/demo-cleanup/route.ts` — ganti `processWaitlist` ke `cleanupExpiredSessions`

## Security
- Tidak ada shared password yang di-rotate via admin API
- Setiap akun demo terisolasi, credentials dikirim sekali via WhatsApp
- Admin API (service_role) hanya dipakai di server-side cron & webhook

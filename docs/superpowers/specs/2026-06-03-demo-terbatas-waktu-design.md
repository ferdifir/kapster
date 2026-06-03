# Demo Terbatas Waktu (15 Menit)

## Latar Belakang

Calon pengguna ingin mencoba semua fitur Kapster sebelum mendaftar. Perlu cara yang aman dan terstruktur untuk memberikan akses demo tanpa mengganggu data asli.

## Arsitektur

### 1 Akun Demo Tunggal

Satu akun Supabase Auth + barbershop Fred digunakan sebagai akun demo publik. Data barbershop (services, barbers, queues) sudah terisi realistik untuk pengalaman demo yang autentik.

### Waitlist

Jika akun sedang dipakai, user lain masuk antrian dan akan dinotifikasi otomatis ketika session selesai.

---

## Database

### Tabel Baru: `demo_sessions`

```sql
CREATE TABLE public.demo_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL,
  temp_password TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired')),
  created_at TIMESTAMPTZ DEFAULT now(),
  claimed_at TIMESTAMPTZ DEFAULT now()
);
```

### Tabel Baru: `demo_waitlist`

```sql
CREATE TABLE public.demo_waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL,
  notified_at TIMESTAMPTZ,
  status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'notified', 'claimed', 'expired')),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Modifikasi Akun Fred

| Entity | Field | Nilai Baru |
|--------|-------|-----------|
| auth.users | email | `demo@kapster.my.id` |
| public.profiles | full_name | `Demo Kapster` |
| public.profiles | phone | `62881027979168` |
| public.barbershops | name | `Fred` (biarkan) |

---

## Alur

### Incoming WhatsApp — Template `demo`

User kirim exact-match `demo` ke nomor sistem `62881027979168`.

```
handle_incoming("demo", phone):

  if session_aktif():
    if sudah_di_waitlist(phone):
      reply("Kamu sudah dalam antrian, sabar ya")
    else:
      add_waitlist(phone, 'waiting')
      reply(⏳ sisa waktu + estimasi selesai)

  else:
    if punya_status_notified(phone):       # dapat notif "kirim demo dlm 2 menit"
      claim_waitlist(phone)                # langsung jadi session
      reply(✅ kredensial + link login)
    else:
      create_session(phone)
      reply(✅ kredensial + link login)

→ Kirim 'batal' kapan saja → HAPUS dari waitlist
```

### Cron — Tiap 60 Detik (via pg_cron)

Mengikuti pattern existing: SQL migration menjadwalkan `pg_cron` yang memanggil `net.http_post()` ke endpoint API. Endpoint dilindungi dengan `CRON_SECRET` (Authorization: Bearer) seperti cron blog existing.

```
1. SELECT demo_sessions WHERE expires_at < now() AND status = 'active'
   ├─ Reset password Fred ke random baru
   ├─ UPDATE status = 'expired'
   └─ Cek waitlist:
       └─ SELECT waiting ORDER BY created_at LIMIT 1
           ├─ UPDATE status = 'notified', notified_at = now()
           └─ Kirim: 🔔 siap, kirim 'demo' dalam 2 menit

2. SELECT waitlist WHERE status = 'notified' AND notified_at < now() - 2 menit
   └─ UPDATE status = 'expired' (kehilangan giliran)
```

### Password Generation

- Format: `Demo@` + 12 karakter random (huruf besar, kecil, angka, simbol)
- Contoh: `Demo@8kLm9XpQ2Zn!`
- Minimal 8 karakter (sesuai validasi register)

### Password Reset Saat Expired

- Generate password random baru
- Set via `supabase.auth.admin.updateUserById(userId, { password })`
- Password baru tidak pernah dikirim ke siapa pun (akun jadi terkunci)
- `temp_password` di `demo_sessions` sengaja disimpan plaintext (dikirim ke user via WA), langsung overwrite saat reset berikutnya

---

## Komponen

### Backend

| File | Isi |
|------|-----|
| `lib/demo.ts` | `generatePassword()`, `setDemoPassword()`, `requestDemo(phone)`, `isSessionActive()`, `expireSession()`, `processWaitlist()` |
| `lib/wuzapi.ts` | Fungsi utilitas sudah ada (`sendTextMessage`) — cukup digunakan langsung |
| `app/api/webhook/whatsapp/route.ts` | Tambah handler untuk private message (bukan group) dengan template matching |
| `app/api/cron/demo-cleanup/route.ts` | GET endpoint — expire sessions + notifikasi waitlist |
| `supabase/migrations/YYYYMMDDHHMMSS_demo_tables.sql` | Migration untuk `demo_sessions` dan `demo_waitlist` |

### Migration

```sql
-- supabase/migrations/YYYYMMDDHHMMSS_demo_tables.sql

CREATE TABLE public.demo_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL,
  temp_password TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired')),
  created_at TIMESTAMPTZ DEFAULT now(),
  claimed_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.demo_sessions ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.demo_waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL,
  notified_at TIMESTAMPTZ,
  status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'notified', 'claimed', 'expired')),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.demo_waitlist ENABLE ROW LEVEL SECURITY;
```

---

## Perubahan pada Webhook WhatsApp

Webhook existing (`/api/webhook/whatsapp`) saat ini hanya:

- `type === "GroupInfo"` → `handleGroupInfo`
- `type === "Message"` → `handleMessage` (khusus group)

Perlu tambah:

- `type === "Message"` → deteksi JID tujuan:
  - `@g.us` → `handleMessage` (group bot — existing)
  - `@s.whatsapp.net` → `handleDemoRequest` (baru)

---

## Keamanan

- **Template exact match**: pesan harus persis `demo` (case-insensitive, trim). Jika tidak cocok, abaikan.
- **Webhook token**: diverifikasi dengan `SYSTEM_WUZAPI_TOKEN` di setiap request.
- **Password reset**: hanya via Supabase Admin (service_role) di server-side.
- **Cron endpoint**: sebaiknya dilindungi (atau via Supabase pg_cron + edge function).
- **RLS**: tabel `demo_sessions` dan `demo_waitlist` tidak perlu diakses dari client — hanya server.
- **Rate limit**: 1 session aktif. Lebih dari itu masuk waitlist.

---

## Testing (Playwright MCP)

Setiap komponen diuji menggunakan browser automation tools (Playwright MCP) yang sudah tersedia:

1. **Webhook handler** — kirim payload simulasi langsung ke endpoint, verifikasi response WA dan row di database
2. **Cron cleanup** — panggil endpoint cron, verifikasi session expired + waitlist ter-notify
3. **Login browser** — navigasi ke `/auth/login`, isi kredensial demo, verifikasi redirect ke `/dashboard`
4. **Session expired** — login, expire session via DB, akses ulang `/dashboard`, verifikasi redirect ke login

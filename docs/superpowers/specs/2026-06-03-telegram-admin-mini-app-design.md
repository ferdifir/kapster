# Telegram Admin Mini App — Design Document

## 1. Ringkasan

Telegram Mini App sebagai super admin panel untuk kapster. Memberikan akses penuh ke dashboard KPIs, manajemen users/barbershops, system health monitoring, VPS terminal & file manager, SQL query runner, dan SEO audit — langsung dari Telegram.

## 2. Arsitektur

**Pendekatan:** Modular Page-Based di dalam proyek kapster (Next.js App Router)

```
app/admin/
  layout.tsx            # Auth gate + Telegram WebApp init + sidebar navigasi
  page.tsx              # Redirect ke dashboard
  dashboard/            # Ringkasan KPIs
  barbershops/          # Daftar & manage barbershop
  users/                # Manage users
  system/               # System health monitor
  terminal/             # VPS terminal (WebSocket + xterm.js)
  files/                # VPS file browser
  sql/                  # SQL query runner
  seo/                  # SEO audit dashboard & trigger
  api/
    sql/                # SQL execution endpoint
    terminal/           # WebSocket endpoint untuk SSH
    files/              # File CRUD via API
    system/             # Server metrics API
```

**Stack tambahan:** `@telegram-apps/sdk`, `xterm`, `xterm-addon-fit`, `ssh2`

## 3. Autentikasi & Keamanan

- Verifikasi HMAC `Telegram.WebApp.initData` di server
- Cek `telegram_id` terhadap tabel superadmin
- Tambah field `telegram_id` di tabel `profiles` atau tabel `admin_users`
- SQL runner: read-only mode default, block DDL, semua query di-log
- Terminal: SSH key-based auth via env variable
- Semua akses hanya untuk superadmin

## 4. Halaman & Fitur

### 4.1 Dashboard (`/admin/dashboard/`)
- Kartu statistik: total barbershops, revenue bulan ini, total customers, active subscribers
- Grafik: revenue trend (7/30 hari), customer growth
- Quick actions: trigger cron, cek sistem

### 4.2 Barbershop Management (`/admin/barbershops/`)
- Tabel dengan search & filter (kota, status subscription)
- Detail per barbershop: info lengkap, statistik
- Aksi: suspend/activate, reset subscription

### 4.3 User Management (`/admin/users/`)
- Tabel users: nama, telepon, role, verified, created_at
- Filter by role
- Aksi: verifikasi, ubah role, disable

### 4.4 SQL Query Runner (`/admin/sql/`)
- Textarea SQL input + Execute button
- Read-only mode (SELECT only) + toggle untuk write dengan konfirmasi
- EXPLAIN ANALYZE support
- Riwayat query (localStorage)
- Shortcut template query
- Block DDL (DROP/TRUNCATE) otomatis

### 4.5 System Health (`/admin/system/`)
- Server: uptime, CPU, RAM, disk, OS info
- Database: connection pool, query perf
- WhatsApp gateway status
- Cron jobs: last run, success/failure
- Error logs: 10 terbaru
- Auto-refresh 30 detik

### 4.6 VPS Terminal (`/admin/terminal/`)
- xterm.js client dengan WebSocket backend
- SSH via `ssh2` dengan key-based auth
- Resize terminal, multi-tab sessions

### 4.7 File Manager (`/admin/files/`)
- Tree view direktori, breadcrumb
- Upload, download, edit file inline
- Rename, delete, chmod

### 4.8 SEO Audit Dashboard (`/admin/seo/`)
- Trigger SEO audit (jalankan `scripts/seo-audit.ts`)
- Riwayat & detail hasil audit
- Skor, issues, rekomendasi per audit

## 5. Database Changes

- Migration: tambah kolom `telegram_id` (text, unique) di tabel `profiles`
- Admin ditandai dengan role = 'superadmin' di tabel `profiles` (sudah ada enum `user_role`)
- Admin Telegram IDs disimpan di env `ADMIN_TELEGRAM_IDS` untuk verifikasi awal
- Tabel `query_logs` baru untuk log semua query SQL yang dijalankan (opsional)

## 6. Environment Variables

```
TELEGRAM_BOT_TOKEN=       # existing
TELEGRAM_BOT_WEBHOOK_URL= # existing
ADMIN_TELEGRAM_IDS=       # comma-separated telegram IDs superadmin
SSH_HOST=                 # VPS host
SSH_PORT=                 # VPS port (default 22)
SSH_USERNAME=             # VPS username
SSH_PRIVATE_KEY_PATH=     # path to SSH private key on server
SSH_PRIVATE_KEY=          # inline SSH private key content (alternatif)
```

## 7. Keamanatan

- Semua endpoint admin hanya bisa diakses superadmin
- Verifikasi HMAC Telegram di setiap request
- SQL: DDL blocked, write memerlukan toggle manual
- Terminal: no password auth, SSH key only
- File: restricted path (tidak bisa akses sembarangan)

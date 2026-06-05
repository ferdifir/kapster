# Kapster Knowledge Base

## Produk
Kapster adalah sistem manajemen antrian digital untuk barbershop di Indonesia. Berbasis web, tidak perlu instalasi aplikasi.

### Harga
- Rp10.000/bulan — flat, semua fitur termasuk
- Bayar via Pakasir (QRIS / Virtual Account)
- Cancel kapan saja, tidak ada kontrak
- Tidak ada free trial, tapi ada demo 15 menit

### Cara Registrasi
1. Buka kapster.my.id
2. Buat akun (email + password + verifikasi WhatsApp OTP)
3. Isi profil barbershop (nama, alamat, logo, layanan)
4. Subscribe (bayar Rp10.000)
5. Siap digunakan

### Setup
- Setup kurang dari 5 menit
- Pelanggan tidak perlu install aplikasi
- Cukup share link halaman publik barbershop

### Kontak
- Email: hello@kapster.my.id
- Grup WhatsApp komunitas (tanya via #ask atau #tanya)

---

## Fitur

### Antrian Digital
Antrian otomatis tanpa kertas. Pelanggan lihat posisi dari HP.

**Alur status:** waiting (Menunggu) → called (Dipanggil) → serving (Dilayani) → done (Selesai)

Status lain: skip — pelanggan tidak datang saat dipanggil. Bisa dipanggil ulang.

**Data:**
- Satu antrian per barbershop per hari (otomatis dibuat saat dibuka)
- Nomor antrian otomatis berurutan
- Real-time update via Supabase Realtime

**Batas:** 50 pelanggan per hari

**Operasi:**
- Buka/tutup antrian kapan saja
- Tambah pelanggan manual (nama + no HP)
- Panggil, mulai layani, selesaikan
- Panggil ulang (skip → called)
- Urutkan ulang nomor antrian

### Booking Online
Pelanggan booking dari halaman publik barbershop.

**Alur status:** pending (Menunggu konfirmasi) → confirmed (Dikonfirmasi) → done (Selesai)
Atau: pending → cancelled (Dibatalkan)

**Aturan:**
- Booking window: 7 hari ke depan
- Owner harus konfirmasi booking
- Notifikasi reminder 1 jam sebelum via WhatsApp
- Pelanggan bisa pilih barber dan layanan

### Dashboard Bisnis
Semua data dalam satu layar.

**Fitur:**
- Pendapatan harian
- Jumlah pelanggan
- Kinerja per barber
- Status antrian real-time
- Manajemen booking

### Multi-Barber
Kelola beberapa barber sekaligus.

**Fitur:**
- Tambah barber dengan nama
- Kirim undangan ke barber via WhatsApp
- Barber punya portal sendiri (mobile-first)
- Barber bisa: lihat antrian, panggil, layani, selesaikan
- Aktif/nonaktifkan barber

**Portal Barber:** `/barber` — tampilan mobile-first, PWA-ready

### Halaman Publik
Setiap barbershop dapat halaman sendiri.

- URL: `kapster.my.id/q/{slug}`
- Tampilkan logo, cover, galeri
- Daftar layanan + harga
- Booking langsung dari halaman ini
- Cari barbershop via peta

### TV Display (Antrian di TV)
Tampilkan antrian di TV monitor barbershop.

**URL:** `/display/{slug}`
**Tampilan:**
- Header: logo + nama + jam
- "Sedang Dilayani": nomor besar + nama pelanggan (border emas)
- "Dipanggil Berikutnya": nomor yang dipanggil
- Footer: total dilayani
- Kalau tutup: tampilkan "TUTUP"
- Update real-time otomatis

### Notifikasi WhatsApp Otomatis
Notifikasi otomatis ke pelanggan via WhatsApp.

**Event notifikasi:**
| Event | Dikirim Saat |
|-------|-------------|
| join_queue | Pelanggan masuk antrian |
| queue_called | Dipanggil |
| queue_serving | Sedang dilayani |
| queue_done | Selesai |
| queue_number_update | Nomor diubah |
| booking_confirmed | Booking dikonfirmasi |
| booking_reminder | 1 jam sebelum booking |
| registration_otp | Kode OTP registrasi |
| password_reset_otp | Kode OTP reset password |

**Cara konek WhatsApp:**
1. Setting → WhatsApp → Connect
2. Scan QR code dengan WhatsApp mobile
3. Status terkoneksi

### Layanan (Services)
Setiap barbershop bisa mengelola daftar layanan.

**Field:** nama, harga (IDR), durasi (menit, default 30, min 5 max 240), aktif/nonaktif
**Operasi:** tambah, edit, hapus, toggle aktif

### Peta Barbershop
Cari barbershop terdekat via OpenStreetMap.

---

## Langganan & Pembayaran

### Status Langganan
| Status | Arti |
|--------|------|
| active | Langganan aktif |
| cancelled | Dibatalkan owner, masih aktif sampai periode habis |
| expired | Periode habis |

### Status Pembayaran
| Status | Arti |
|--------|------|
| pending | Menunggu pembayaran |
| completed | Berhasil |
| failed | Gagal |
| expired | Kedaluwarsa |

### Alur Bayar
1. User klik "Bayar" di halaman billing
2. System buat record payment (pending) + redirect ke Pakasir
3. User bayar via QRIS / VA di Pakasir
4. Pakasir kirim webhook ke `/api/webhook/pakasir`
5. System update payment → completed, buat/perpanjang subscription 30 hari
6. Hanya pembayaran pertama yang kredit komisi referral

### Kalau Tidak Bayar
- Cek otomatis di setiap halaman dashboard
- Kalau `current_period_end < now` → status jadi expired → redirect ke `/billing`
- Kalau belum pernah bayar → redirect ke `/billing`
- Yang diizinkan: status active atau cancelled (masih dalam periode)

---

## Demo

### Cara Akses Demo
- Kirim pesan "demo" ke nomor WhatsApp sistem (62881027979168)
- Bot akan kirim email + password random
- Sesi berlaku 15 menit
- Bisa dicoba berkali-kali (setiap kirim "demo" dapat akun baru)

### Cara Kerja Demo
1. Cek nomor HP sudah punya sesi aktif → kirim ulang kredensial
2. Generate email random (demo-{random}@kapster.my.id)
3. Generate password random
4. Buat auth user (max 5 retry)
5. Kirim kredensial via WhatsApp
6. Sesi auto-expire 15 menit
7. Cron cleanup tiap 60 detik → hapus user + update status expired

---

## Referral / Affiliate

### Cara Kerja
- Setiap barbershop punya kode referral unik (format: {slug}-{random4})
- Komisi: Rp3.500 per referral (dibayarkan saat pertama kali referral bayar)
- Minimal payout: Rp25.000
- Cookie referral: 45 hari (kalau dalam 45 hari daftar + bayar, referrer dapat komisi)

### Status Referral
| Status | Arti |
|--------|------|
| pending | Sudah daftar, belum bayar |
| earned | Sudah bayar pertama, komisi masuk |
| paid | Komisi sudah dicairkan |

### Cara Share
1. Buka halaman referral di dashboard
2. Copy link: `kapster.my.id?ref=KODE`
3. Share ke teman barbershop
4. Kalau teman daftar + bayar, dapat Rp3.500

---

## Role Pengguna
| Role | Akses |
|------|-------|
| owner | Full dashboard, billing, kelola barber |
| barber | Portal barber (antrian + pelanggan) |
| customer | Halaman publik, booking |
| superadmin | Admin panel, semua data |

---

## Autentikasi

### Registrasi
1. Isi email + password + nomor WhatsApp
2. Sign up via Supabase Auth
3. Kirim OTP 6 digit via WhatsApp
4. Verifikasi OTP (berlaku 5 menit, max percobaan tertentu)
5. Redirect ke onboarding

### OTP
- 6 digit, di-hash SHA-256
- Dikirim via WhatsApp
- Berlaku 5 menit
- Tujuan: verifikasi nomor WhatsApp (registrasi) atau reset password

### Keamanan
- Kalau sudah login dan buka `/auth/register` → redirect ke dashboard
- Kalau register gagal kirim OTP → tetap ke halaman OTP (bisa resend setelah 60 detik)
- Onboarding cek `phone_verified_at` — kalau belum verify WA → redirect ke OTP

---

## Bot WhatsApp Grup

### Cara Pakai
- Di grup komunitas Kapster, kirim pesan dengan `#ask` atau `#tanya`
- Bot akan jawab otomatis
- Pertanyaan harus seputar Kapster

---

## Content & Blog

### Blog
- Artikel SEO tentang barbershop
- Generate otomatis tiap 12 jam (06:00 dan 18:00 WIB)
- Pipeline: research → content → SEO → card image
- Dipublikasikan ke Telegram
- 12 post per halaman

### Social Media Content
- Konten untuk Instagram & TikTok
- Generate harian
- 3 pilar konten: Edukasi (35%), Solusi (50%), Bukti Sosial (15%)

### Admin Panel
- Akses via Telegram Mini App
- Fitur: file browser, SQL terminal, system metrics
- Kelola referral, SEO, marketing leads

---

## Database Notes
- Supabase (PostgreSQL)
- Realtime via `postgres_changes`
- Cron jobs via `pg_cron`
- Edge Functions untuk WA sender
- File storage: Supabase Storage

## Teknis
- **Frontend:** Next.js (App Router), TypeScript, Tailwind CSS
- **Backend:** Supabase (Auth, DB, Storage, Edge Functions, Realtime)
- **AI:** Groq (llama-3.3-70b-versatile), OpenRouter, Ollama
- **WhatsApp:** WuzAPI (linkjo.my.id)
- **Pembayaran:** Pakasir
- **Notifikasi Error:** Telegram
- **Map:** OpenStreetMap (Leaflet)

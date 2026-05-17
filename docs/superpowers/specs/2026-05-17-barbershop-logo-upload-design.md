# Desain Fitur: Upload Logo Barbershop

## Ringkasan

Menambahkan fitur upload logo di admin dashboard (halaman Settings) yang kemudian ditampilkan di halaman publik: Display Queue (`/display/[slug]`) dan halaman Booking Customer (`/q/[slug]`).

File disimpan di Supabase Storage bucket `logos`, URL disimpan di kolom `logo_url` tabel `barbershops` (sudah ada).

---

## Arsitektur

### 1. Supabase Storage Bucket

- **Nama bucket**: `logos`
- **Akses**: Public (read tanpa auth, write dengan auth)
- **Path**: `logos/{barbershop_id}/logo.{ext}`
- **Limit**: max 2MB, hanya gambar (PNG, JPG, WebP, GIF)
- **RLS Policies**:
  - INSERT: authenticated user, barbershop_id di path cocok dengan barbershop yang user miliki (via join ke tabel barbershops)
  - SELECT: public (anon)
  - DELETE: authenticated user, barbershop_id di path cocok dengan barbershop yang user miliki

### 2. Alur Upload

1. User pilih file di admin dashboard → validasi client (tipe MIME + ukuran ≤ 2MB)
2. Upload langsung ke Supabase Storage via browser client
3. Dapatkan public URL dari hasil upload
4. Panggil Server Action `updateBarbershopLogo(barbershopId, logoUrl)`
5. Server Action verifikasi ownership → update `logo_url` di tabel `barbershops`
6. Revalidate path: `/dashboard/settings`, `/display/[slug]`, `/q/[slug]`
7. Jika logo lama ada, hapus file lama dari storage (cleanup)

### 3. Tampilan di Halaman Publik

- **Display Queue** (`/display/[slug]`): Logo di header, ~40px, di sebelah kiri nama barbershop
- **Booking Customer** (`/q/[slug]`): Logo di atas halaman, ~80px, centered, menggantikan avatar inisial
- **Fallback**: jika `logo_url` null/empty, tampilkan komponen `<Logo />` SVG default atau avatar inisial

---

## Komponen UI

### 1. `LogoUploader` (Client Component)

**File**: `components/dashboard/LogoUploader.tsx`

**Props**:
- `barbershopId: string`
- `currentLogoUrl: string | null`

**State**:
- `uploading: boolean` — progress indicator
- `error: string | null` — pesan error
- `success: boolean` — flash message "Logo berhasil diperbarui"

**Behavior**:
- Input file tersembunyi, trigger via tombol/area klik
- Preview logo saat ini (lingkaran 120px)
- Hover overlay: "Klik untuk ganti"
- Validasi sebelum upload: `file.type.startsWith('image/')` && `file.size <= 2 * 1024 * 1024`
- Upload via `supabase.storage.from('logos').upload(path, file, { upsert: true })`
- Setelah upload sukses, panggil `updateBarbershopLogo()` server action (server action menangani cleanup file lama)

**UI Layout**:
```
┌─────────────────────────────┐
│  Branding                   │
│                             │
│  ┌───────────┐              │
│  │           │              │
│  │   LOGO    │  Klik untuk  │
│  │  (120px)  │  mengganti   │
│  │           │              │
│  └───────────┘              │
│                             │
│  [Upload Logo]              │
│  PNG, JPG, WebP. Maks 2MB.  │
└─────────────────────────────┘
```

### 2. Perubahan `SettingsForm`

**File**: `components/dashboard/SettingsForm.tsx`

- Tambah section "Branding" paling atas, sebelum "Informasi Barbershop"
- Tambah `LogoUploader` di dalam section tersebut
- Props `barbershop` ditambah field `logo_url`
- Tidak mengubah logic form existing

### 3. Perubahan Settings Page (Server)

**File**: `app/dashboard/settings/page.tsx`

- Query tambah kolom `logo_url`: `.select("id, name, slug, address, city, phone, wa_number, latitude, longitude, settings_json, logo_url")`
- Pass `logo_url` ke `SettingsForm`

---

## Server Actions

### `updateBarbershopLogo(barbershopId, logoUrl)`

**File**: `app/dashboard/settings/actions.ts`

```
Input: barbershopId: string, logoUrl: string
Output: { error?: string }
```

**Logic**:
1. Verifikasi user authenticated
2. Verifikasi ownership: `barbershops.owner_id === user.id`
3. Baca `logo_url` lama dari database
4. Jika `logo_url` lama ada dan berbeda dari URL baru, hapus file lama dari storage via Supabase admin client
5. Update `logo_url` di tabel `barbershops`
6. Revalidate `/dashboard/settings`, `/display/[slug]`, `/q/[slug]`
7. Return `{}` jika sukses, `{ error: message }` jika gagal

---

## Perubahan Halaman Publik

### Display Queue (`app/display/[slug]/page.tsx`)

- Query barbershop tambah kolom `logo_url`
- Header: tampilkan logo (40px, rounded) di sebelah kiri nama barbershop
- Fallback: SVG `<Logo />` default jika `logo_url` null

### Booking Customer (`app/q/[slug]/page.tsx`)

- Query barbershop tambah kolom `logo_url`
- Ganti avatar inisial dengan logo jika tersedia (80px, rounded-2xl)
- Fallback: avatar inisial dengan gold gradient (existing behavior)

---

## Error Handling

| Skenario | Penanganan |
|----------|-----------|
| File bukan gambar | Error client: "File harus berupa gambar" |
| File > 2MB | Error client: "Ukuran file maksimal 2MB" |
| Upload gagal (network) | Error: "Gagal mengupload logo, coba lagi" |
| Storage bucket belum dibuat | Error server: "Storage belum dikonfigurasi" |
| User tidak owner | Error server: "Unauthorized" |

---

## Migration

File: `supabase/migrations/add_logo_storage.sql`

1. Buat storage bucket `logos` (public)
2. RLS policy: SELECT untuk public, INSERT/DELETE untuk authenticated owner
3. Pastikan kolom `logo_url` di `barbershops` sudah ada (sudah ada, verified)

---

## File yang Dibuat/Dimodifikasi

| File | Aksi |
|------|------|
| `supabase/migrations/add_logo_storage.sql` | Baru |
| `components/dashboard/LogoUploader.tsx` | Baru |
| `components/dashboard/SettingsForm.tsx` | Modifikasi |
| `app/dashboard/settings/page.tsx` | Modifikasi |
| `app/dashboard/settings/actions.ts` | Modifikasi |
| `app/display/[slug]/page.tsx` | Modifikasi |
| `app/q/[slug]/page.tsx` | Modifikasi |
| `lib/supabase/types.ts` | Regenerate (auto) |

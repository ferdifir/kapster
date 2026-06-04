# Dashboard Settings — Tab Navigation

## Latar Belakang

Halaman Pengaturan dashboard (`/dashboard/settings`) saat ini menampilkan 9 section dalam satu halaman scroll vertikal. User harus scroll jauh ke bawah untuk mencapai tombol Simpan. Dengan tab navigation, user bisa berpindah antar kelompok pengaturan tanpa scroll panjang.

## Arsitektur

### Approach: Extract Per-Tab Component

`SettingsForm.tsx` (492 baris) di-refactor dengan pola yang sama seperti `FeedbackTabs.tsx`:

- **File utama**: `components/dashboard/SettingsForm.tsx` — tab bar + routing state, tetap jadi client component
- **Tiap tab diextract ke file sendiri**:
  - `components/dashboard/settings/ProfilTab.tsx`
  - `components/dashboard/settings/InformasiTab.tsx`
  - `components/dashboard/settings/LokasiTab.tsx`
  - `components/dashboard/settings/WhatsAppTab.tsx`

### Tab Bar

Mengikuti pola existing `FeedbackTabs.tsx`:

```
p-1 bg-dark-800/50 rounded-xl border border-dark-700/30 w-fit
```

Tombol tab: `button` dengan conditional class:
- **Active**: `bg-barber-400/10 text-barber-400`
- **Inactive**: `text-dark-400 hover:text-dark-200`

Setiap tab punya ikon Lucide:
- **Profil** → `User` icon
- **Informasi** → `Info` icon
- **Lokasi** → `MapPin` icon
- **WhatsApp** → `MessageCircle` icon

### Layout per Tab

```
┌──────────────────────────────────────────┐
│  Pengaturan                               │
│                                           │
│  ┌─────────────────────────────────────┐  │
│  │ [Profil] [Informasi] [Lokasi] [WA] │  │
│  └─────────────────────────────────────┘  │
│                                           │
│  ┌─ konten tab aktif ──────────────────┐  │
│  │  (section sesuai tab)               │  │
│  │                                     │  │
│  │  [Simpan] per tab (kalau ada form)  │  │
│  └─────────────────────────────────────┘  │
└──────────────────────────────────────────┘
```

### Isi per Tab & Mekanisme Save

| Tab | Isi | Simpan |
|-----|-----|--------|
| **Profil** | `<LogoUploader />` (auto), `<CoverImageUploader />` (auto), `<GalleryManager />` (auto), About textarea (500 char) | About: tombol Simpan sendiri via `updateBarbershopSettings()` |
| **Informasi** | Nama (required), Slug (readonly), Alamat, Kota, Telepon, No. WA, Booking Max Days (number, 1-365) | Satu tombol Simpan via `updateBarbershopSettings()` + `updateBookingMaxDays()` |
| **Lokasi** | `<MapPicker />` | Auto-save pas marker drop via `updateBarbershopLocation()` (sama seperti sekarang) |
| **WhatsApp** | Disclaimer checkbox, Connect/Disconnect buttons, QR code display, polling 3s via `checkWhatsAppStatus()` | Tombol sendiri (sama seperti sekarang) |

### Daftar Tab Component

#### `ProfilTab.tsx`
Props: `barbershop: Barbershop`
- Mengandung LogoUploader, CoverImageUploader, GalleryManager
- About textarea dengan state lokal + tombol Simpan

#### `InformasiTab.tsx`
Props: `barbershop: Barbershop`
- Field: name, address, city, phone, wa_number, bookingMaxDays
- Slug ditampilkan readonly
- Satu form dengan satu tombol Simpan (submit form)
- Panggil `updateBarbershopSettings()` + `updateBookingMaxDays()`

#### `LokasiTab.tsx`
Props: `barbershop: Barbershop`
- Wrap MapPicker yang sudah ada (dynamically imported, SSR disabled)

#### `WhatsAppTab.tsx`
Props: `barbershop: Barbershop`
- Copy-paste dari section WhatsApp yang sudah ada di SettingsForm saat ini
- Disclaimer checkbox, connect/disconnect, QR, polling

### Existing Code yang Tidak Berubah

- `app/dashboard/settings/page.tsx` — tetap server component, fetch barbershop, render `<SettingsForm />`
- `app/dashboard/settings/actions.ts` — semua server actions tetap sama
- `components/dashboard/LogoUploader.tsx` — tidak berubah
- `components/dashboard/CoverImageUploader.tsx` — tidak berubah
- `components/dashboard/GalleryManager.tsx` — tidak berubah
- `components/dashboard/MapPicker` — tidak berubah (sudah dynamic import)

## Files yang Berubah

| File | Tindakan |
|------|----------|
| `components/dashboard/SettingsForm.tsx` | Refactor: tambah tab state, extract sections ke file terpisah |
| `components/dashboard/settings/ProfilTab.tsx` | **Baru** — extract dari SettingsForm |
| `components/dashboard/settings/InformasiTab.tsx` | **Baru** — extract dari SettingsForm |
| `components/dashboard/settings/LokasiTab.tsx` | **Baru** — extract MapPicker + ubah ke dynamic import |
| `components/dashboard/settings/WhatsAppTab.tsx` | **Baru** — extract WhatsApp section |

## Error Handling

- Masing-masing tab handle error untuk action-nya sendiri (sama seperti sekarang)
- Loading state: tombol Simpan disabled + spinner selama request
- Error ditampilkan via state `error` string di tiap tab
- Success feedback via state `success` string di tiap tab

## Catatan

- `lucide-react` sudah ada di package.json (`^1.16.0`) tapi belum dipakai di settings — sekarang akan dipakai untuk ikon tab
- Slug tetap readonly — tidak ada perubahan
- Semua state management tetap pakai `useState` lokal, konsisten dengan codebase existing

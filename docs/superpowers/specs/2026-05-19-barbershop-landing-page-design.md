# Design: Barbershop Landing Page

**Date:** 2026-05-19
**Status:** Draft

## Overview

Setiap barbershop bisa memilih template dan mengkonfigurasi tampilan halaman publik mereka (`/q/{slug}`) agar terlihat seperti landing page profesional, bukan sekadar halaman antrian.

## Data Model

Semua konfigurasi disimpan di `settings_json` kolom pada tabel `barbershops`. Tidak ada tabel baru.

### settings_json Structure

```json
{
  "booking_max_days": 7,
  "show_in_directory": true,
  "design": {
    "template": "classic",
    "colors": {
      "primary": "#d4a574",
      "accent": "#c4956a",
      "background": "#0f0f0f"
    },
    "sections": {
      "hero": { "visible": true },
      "queue_status": { "visible": true },
      "services": { "visible": true },
      "gallery": { "visible": true },
      "barbers": { "visible": true },
      "location": { "visible": true },
      "hours": { "visible": true },
      "testimonials": { "visible": false }
    },
    "gallery_images": [
      { "url": "/storage/...", "caption": "...", "order": 0 }
    ],
    "tagline": "Barbershop Terbaik di Jaksel",
    "operating_hours": {
      "monday": { "open": "09:00", "close": "21:00", "closed": false },
      "tuesday": { "open": "09:00", "close": "21:00", "closed": false },
      "wednesday": { "open": "09:00", "close": "21:00", "closed": false },
      "thursday": { "open": "09:00", "close": "21:00", "closed": false },
      "friday": { "open": "09:00", "close": "21:00", "closed": false },
      "saturday": { "open": "09:00", "close": "22:00", "closed": false },
      "sunday": { "open": "10:00", "close": "20:00", "closed": false }
    },
    "testimonials": [
      { "name": "Andi", "rating": 5, "comment": "Bagus banget!" }
    ]
  }
}
```

### Storage

Bucket baru `gallery-images` (public read, authenticated write) untuk foto gallery. Pattern RLS mengikuti bucket `logos` yang sudah ada.

## Routing

### Public Page: `/q/{slug}`

Halaman yang sama, tapi kontennya berubah dari antrian sederhana menjadi landing page hybrid scrollable.

**Section order (top to bottom):**
1. Sticky top bar — logo + nama + status badge + CTA
2. Hero — tagline + CTA
3. Queue status — widget antrian real-time
4. Services — daftar layanan + harga
5. Gallery — grid foto
6. Barbers — profil tim
7. Hours — jam operasional
8. Location — alamat + peta
9. Testimonials — review pelanggan
10. Footer — powered by Kapster

Hero dan queue_status selalu visible. Section lain muncul sesuai toggle.

### Admin Page: `/dashboard/design`

Menu baru di sidebar dashboard untuk mengatur desain landing page.

## Dashboard UI

### Template Selector
- Card-based selector dengan preview thumbnail
- 3 template awal: Classic, Modern, Bold
- Klik card untuk apply template

### Color Customization
- Color picker untuk primary, accent, background
- Live preview warna saat diubah

### Section Toggles
- Toggle on/off per section
- Default: semua on kecuali testimonials
- Section tanpa data (gallery kosong, barber 0) otomatis hidden meski toggle on

### Gallery Manager
- Upload multiple foto
- Drag to reorder
- Hapus foto individual
- Preview thumbnail

### Preview Button
- "Lihat Landing Page" buka `/q/{slug}` di tab baru

## Public Landing Page UI

### Sticky Top Bar
- Selalu terlihat saat scroll
- Logo kecil + nama barbershop
- Badge Open/Closed (hijau/merah)
- Tombol "Join Queue" (gold gradient)

### Hero Section
- Full-width background (warna/gradient dari template)
- Nama barbershop (large, bold)
- Tagline (dari settings, optional)
- CTA "Join Queue" prominent

### Queue Widget
- Card dengan statistik: waiting count, served count
- Polling setiap 30s (seperti sekarang)
- Jika queue belum buka: tampilkan "Belum Buka" + date picker

### Services Section
- List card per service: nama, harga, durasi
- Grid 1 kolom di mobile, 2 kolom di desktop

### Gallery Section
- Grid responsive (2 kolom mobile, 3 desktop)
- Click to expand (lightbox sederhana)
- Lazy load images

### Barbers Section
- Card per barber: foto (jika ada), nama
- Horizontal scroll di mobile

### Hours Section
- Tabel hari + jam buka
- Highlight hari ini

### Location Section
- Alamat teks
- Maplibre map (jika koordinat ada)
- Link ke Google Maps

### Testimonials Section
- Placeholder: section visible tapi tampilkan "Belum ada testimoni" jika data kosong
- Data source: manual input oleh owner via dashboard (nama, rating, komentar)
- Simpan di settings_json.design.testimonials sebagai array: [{ name, rating, comment }]
- Card carousel sederhana, swipe di mobile

### Join Queue
- Bisa berupa section di bawah atau modal/popup
- Form yang sama seperti sekarang (nama, phone, service, barber)
- Setelah submit: redirect ke status page

## Templates

### Classic (default)
- Dark theme (#0f0f0f background)
- Gold accents (#d4a574)
- Font: font-display (existing)
- Warm, premium feel

### Modern
- Light theme (#ffffff background)
- Dark text, blue accent
- Clean, minimal
- Larger spacing

### Bold
- Dark background dengan vibrant accent colors
- High contrast
- Energetic, youthful feel

## Error Handling

| Scenario | Behavior |
|----------|----------|
| settings_json.design undefined | Fallback ke Classic template, semua section default on |
| Gallery empty | Section gallery tidak tampil |
| No barbers | Section barbers tidak tampil |
| No coordinates | Location section tampilkan alamat teks saja |
| Queue belum buka | Widget tampilkan "Belum Buka" + date picker |
| Barbershop tidak aktif | 404 (seperti sekarang) |

## Migration

1. Create storage bucket `gallery-images` dengan RLS policies (mirip `logos`)
2. Tidak ada perubahan schema tabel — semua di `settings_json`

## API / Server Actions

### New Server Actions

| Action | Purpose |
|--------|---------|
| `updateDesignTemplate(barbershopId, template)` | Set template |
| `updateDesignColors(barbershopId, colors)` | Update warna |
| `toggleSection(barbershopId, section, visible)` | Toggle section visibility |
| `uploadGalleryImage(barbershopId, file)` | Upload foto ke storage |
| `reorderGallery(barbershopId, imageUrls)` | Reorder gallery |
| `deleteGalleryImage(barbershopId, url)` | Hapus foto |

### Existing Actions (reuse)
- `updateBarbershopSettings` — bisa extend untuk handle design config

## Components

### New Components

| Component | Purpose |
|-----------|---------|
| `components/dashboard/DesignManager.tsx` | Main dashboard page |
| `components/dashboard/TemplateSelector.tsx` | Template picker |
| `components/dashboard/GalleryManager.tsx` | Gallery CRUD |
| `components/landing/HeroSection.tsx` | Hero section |
| `components/landing/QueueWidget.tsx` | Queue status card |
| `components/landing/ServicesSection.tsx` | Services list |
| `components/landing/GallerySection.tsx` | Photo grid |
| `components/landing/BarbersSection.tsx` | Team profiles |
| `components/landing/HoursSection.tsx` | Operating hours |
| `components/landing/LocationSection.tsx` | Map + address |
| `components/landing/TestimonialsSection.tsx` | Reviews carousel |
| `components/landing/StickyBar.tsx` | Sticky top bar |

### Modified Components
- `app/q/[slug]/page.tsx` — refactor dari antrian page ke landing page
- `components/dashboard/Sidebar.tsx` — tambah menu "Desain"

## Security

- RLS: hanya owner barbershop yang bisa edit design config
- Gallery images: public read, authenticated write (owner only)
- Public page: read-only, no auth required

## Future Considerations (Out of Scope)

- Instagram/social media auto-sync untuk gallery
- Custom domain untuk landing page
- SEO meta tags per section
- Analytics untuk landing page views
- Testimonials dari pelanggan (sistem review)
- Custom fonts
- Section ordering (drag to reorder sections)

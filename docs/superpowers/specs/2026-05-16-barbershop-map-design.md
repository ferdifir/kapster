# Barbershop Map Feature Design

## Overview
Menambahkan fitur map untuk menampilkan lokasi barbershop dengan marker interaktif.

## Requirements

### 1. Data Layer
- Tambahkan kolom `latitude` dan `longitude` ke tabel `barbershops`
- Admin bisa klik map untuk input koordinat

### 2. Dashboard Pengaturan (Admin)
- Komponen map di halaman settings barbershop
- Admin klik lokasi di map → koordinat tersimpan otomatis
- Fallback: input manual lat/lng

### 3. Halaman Publik Map
- Halaman `/map` menampilkan semua barbershop dengan marker
- Klik marker → redirect ke halaman barbershop (queue page)

## Technical Stack
- **Map Library**: MapCN.dev dengan OpenStreetMap
- **Framework**: Next.js 16 (App Router)
- **Database**: Supabase (PostgreSQL)

## UI/UX

### Dashboard Settings
- Map dengan marker menunjukkan lokasi tersimpan
- Klik map → update koordinat
- Input manual sebagai fallback

### Halaman /map
- Full-page map dengan semua marker
- Popup pada marker: nama + alamat barbershop
- Klik popup → navigate ke `/q/[slug]`

## Data Schema

```sql
ALTER TABLE barbershops ADD COLUMN latitude numeric;
ALTER TABLE barbershops ADD COLUMN longitude numeric;
```

## Implementation Steps (High-Level)
1. Add database migration for lat/lng columns
2. Create MapCN component with click handler for settings
3. Update barbershop settings page to include map
4. Create public `/map` page with all barbershop markers
5. Add navigation from marker click to barbershop page
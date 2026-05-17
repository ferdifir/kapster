# Design Spec: Pre-Booking Antrian untuk Tanggal Mendatang

**Tanggal:** 2026-05-17
**Status:** Draft — menunggu review user

## Ringkasan

Customer bisa mendaftar antrian untuk tanggal tertentu meskipun antrean belum dibuka. Customer langsung masuk `queue_entries` untuk tanggal yang dipilih dan mendapat nomor urut. Owner menentukan batas hari ke depan (via `settings_json.booking_max_days`).

## Arsitektur

### Data Flow

```
Customer → /q/[slug] → Pilih tanggal → joinQueue(date) → auto-create queue (jika belum ada) → insert entry → status page
```

### Database

Tidak ada perubahan schema. Semua menggunakan field existing:
- `queues.date` — tanggal antrian
- `queues.is_open` — status buka/tutup
- `barbershops.settings_json` — simpan `booking_max_days`

## Komponen

### 1. Frontend `/q/[slug]/page.tsx`

**Perubahan:**
- Hapus conditional `!isOpen` — form selalu tampil
- Tambah date picker (type="date", min=today, max=today + booking_max_days)
- Query queue berdasarkan tanggal yang dipilih customer (default: today)
- Stats (waiting count, total served) mengikuti tanggal yang dipilih
- Jika tanggal yang dipilih ≠ today, tampilkan label tanggal di atas form

**Default behavior:**
- Jika queue today sudah dibuka → default date = today
- Jika queue today belum dibuka → default date = today (tetap bisa pilih tanggal lain)

### 2. Server Action `/q/[slug]/actions.ts` — `joinQueue`

**Signature baru:**
```typescript
joinQueue(barbershopId: string, date: string, formData: {...})
```
Parameter `queueId` dihapus. Server akan resolve `queueId` dari `barbershopId + date`.

**Validasi (urutan):**
1. `date` tidak boleh < today (hard block)
2. `date` tidak boleh > today + `booking_max_days` (hard block, default 7 hari jika setting belum ada)
3. Fetch queue row untuk tanggal tersebut. Jika belum ada, auto-create via upsert (`barbershop_id`, `date`, `is_open: false`) dengan `onConflict: "barbershop_id,date"`
4. Cek `is_open` + daily limit:
   - Jika `is_open = true` → cek daily limit → insert
   - Jika `is_open = false` DAN `date > today` → cek daily limit → insert (pre-booking)
   - Jika `is_open = false` DAN `date = today` → tolak dengan error "Antrian belum dibuka"
5. Insert ke `queue_entries` dengan `next_queue_number`

**Catatan:** Validasi `is_open` ditambahkan untuk fix security gap existing.

### 3. Status Page `/q/[slug]/status/[id]/page.tsx`

**Perubahan:**
- Query queue row untuk mendapatkan `date` dan `is_open` dari entry
- Tampilkan info tanggal di status page
- Logic status display:
  - `date > today` → "Antrian untuk [tanggal] · Menunggu antrean dibuka" (abaikan entry status, karena entry status hanya relevan saat antrean sudah dibuka)
  - `date = today` + `is_open = false` → "Menunggu antrean dibuka"
  - `is_open = true` → tampilkan status normal (waiting/called/serving/done/skip)
- Realtime subscription tetap aktif untuk semua kasus

### 4. Dashboard Queue `/dashboard/queue/page.tsx`

**Perubahan:**
- Tambah date picker untuk navigasi antar tanggal (range: today hingga today + booking_max_days untuk melihat pre-booking, dan today - 7 hari untuk melihat history)
- Query queue + entries berdasarkan tanggal yang dipilih
- Tampilkan badge jumlah pre-booked customers jika `date > today` dan `is_open = false`
- Owner bisa toggle `is_open` untuk tanggal yang dipilih
- Owner bisa menambah customer manual untuk tanggal yang dipilih

### 5. Dashboard Settings `/dashboard/settings/page.tsx`

**Perubahan:**
- Tambah field "Batas Hari Booking" (number input, min=1, max=365)
- Simpan ke `barbershops.settings_json.booking_max_days`
- Default value: 7 hari

## Potensi Bug dan Pencegahan

| Bug | Pencegahan |
|-----|------------|
| Race condition: 2 customer bersamaan create queue untuk tanggal yang sama | `upsert` dengan `onConflict: "barbershop_id,date"` |
| Nomor antrian duplikat | `next_queue_number` RPC sudah atomic di DB |
| Customer manipulasi tanggal lewat via request | Server-side validation wajib, tidak percaya client |
| `booking_max_days` null/undefined di settings | Fallback default 7 hari di server action |
| Timezone mismatch | Selalu gunakan `toISOString().split("T")[0]` di server |
| Status page error jika queue belum ada | Handle null queue, tampilkan fallback |
| Date picker client bisa di-manipulasi | Validasi ulang di server, tidak trust client-side min/max |
| Pre-booking melebihi daily limit | Validasi daily limit berlaku untuk semua tanggal |

## File yang Diubah

1. `app/q/[slug]/page.tsx` — tambah date picker, hapus conditional isOpen
2. `app/q/[slug]/actions.ts` — tambah param date, validasi, auto-create queue, fix is_open check
3. `app/q/[slug]/JoinQueueForm.tsx` — tambah date picker prop, pass date ke action
4. `app/q/[slug]/status/[id]/page.tsx` — tampilkan info tanggal, handle pre-booking status
5. `app/dashboard/queue/page.tsx` — tambah date picker navigasi
6. `components/dashboard/QueueDashboard.tsx` — terima date prop, tampilkan pre-booking info
7. `app/dashboard/settings/page.tsx` — tambah field booking_max_days
8. `lib/supabase/types.ts` — update jika perlu (kemungkinan tidak perlu karena schema tidak berubah)

## Rollback Plan

Jika ada masalah, revert semua perubahan. Data yang sudah masuk `queue_entries` untuk tanggal mendatang tetap valid dan tidak perlu cleanup karena schema tidak berubah.

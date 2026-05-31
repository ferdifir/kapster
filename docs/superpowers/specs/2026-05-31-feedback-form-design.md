# Feedback Form — Kritik & Saran Dashboard

## Overview
Tambahkan halaman feedback/kritik & saran pada dashboard barbershop. User dapat mengirim feedback yang tersimpan di database dan menerima notifikasi Telegram. Tersedia inbox untuk mengelola feedback masuk.

## Routes
- `GET /dashboard/feedback` — Halaman tabbed (form + inbox)

## Database
### New table: `feedback`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | default gen_random_uuid() |
| barbershop_id | uuid FK → barbershops | not null |
| profile_id | uuid FK → profiles | nullable |
| name | text | not null |
| category | text | not null; one of: kritik, saran, feedback, request_fitur |
| message | text | not null |
| screenshot_url | text | nullable |
| is_read | boolean | default false |
| created_at | timestamptz | default now() |

Enable RLS: owner can read/update/delete, any authenticated profile can insert.

## Storage
Bucket: `feedback` (atau pakai bucket `barbershop` yang sudah ada dengan folder path).
Screenshot diupload via Supabase Storage, path: `feedback/{barbershop_id}/{uuid}`.

## Sidebar
Item baru: **Kritik & Saran** (icon `MessageSquare`) — diletakkan setelah **Layanan**, sebelum **Analitik**.

## Halaman Tabbed
### Tab 1: Kirim Feedback
- Nama (prefilled dari profil)
- Kategori (dropdown: Kritik / Saran / Feedback / Request Fitur)
- Pesan (textarea)
- Screenshot (file upload, optional)
- Tombol "Kirim"

### Tab 2: Inbox
- List feedback cards/table per barbershop
- Kolom: nama, kategori, message (truncated), tanggal, status read/unread
- Klik untuk detail view (full message + screenshot)
- Aksi: tandai sudah dibaca, hapus

## Server Actions
- `submitFeedback(formData)` — insert ke DB + kirim Telegram
- `getFeedbackList()` — list feedback untuk barbershop ini
- `markAsRead(id)` — update is_read = true
- `deleteFeedback(id)` — soft/hard delete

## Telegram Notification
Bot token dan chat ID user disediakan.
Format notifikasi saat feedback baru:
```
📩 Feedback Baru dari {name}
🏪 {barbershop_name}
📂 Kategori: {category}
💬 {message (truncated 200 chars)}
```
Gunakan `fetch` langsung ke Telegram Bot API di server action.

## Files to Create
- `app/dashboard/feedback/page.tsx` — server component page
- `components/dashboard/FeedbackForm.tsx` — form component
- `components/dashboard/FeedbackInbox.tsx` — inbox/detail component
- `app/dashboard/feedback/actions.ts` — server actions
- `lib/telegram.ts` — Telegram notification helper
- `supabase/migrations/20260531000000_feedback.sql` — migration

## Files to Modify
- `components/dashboard/Sidebar.tsx` — tambah menu item
- `lib/supabase/types.ts` — tambah tipe Feedback

## Testing
- E2E with Playwright: submit feedback via form, verify Telegram sent (mock), verify inbox shows entry.

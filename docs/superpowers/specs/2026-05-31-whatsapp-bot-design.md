# WhatsApp Bot — Grup Komunitas Kapster

## Ringkasan

WhatsApp bot untuk grup komunitas "Kapster - Sistem Antrian Digital" yang:

1. **Auto-welcome** member baru yang join grup
2. **AI Q&A via #ask/#tanya** — jawab pertanyaan seputar Kapster pakai Groq LLM
3. **Non-Kapster fallback** — tolak pertanyaan di luar topik

## Output

- `lib/groq.ts` — Groq API client
- `lib/whatsapp-bot.ts` — bot logic (welcome, Q&A, fallback)
- `app/api/webhook/whatsapp/route.ts` — webhook endpoint
- Update env vars: `GROQ_API_KEY`, `WHATSBOT_GROUP_JID`
- Update sistem WuzAPI: set webhook, tambah event `GroupInfo`

## Arsitektur

```
WhatsApp User
  ↓ kirim pesan ke grup
whatsmeow (WuzAPI)
  ↓ webhook POST JSON
kapster.my.id/api/webhook/whatsapp
  ↓ parse type
┌─ GroupInfo ─→ lib/whatsapp-bot → send welcome (via WuzAPI)
└─ Message ───→ detect #ask/#tanya?
                  ├─ ya → lib/groq → send jawaban (via WuzAPI)
                  └─ tidak → skip (tidak reply)
```

## Detail Komponen

### 1. Webhook Receiver (`/api/webhook/whatsapp/route.ts`)

- Method: `POST`
- Accept content-type: `application/json`
- Parse payload: `{ type: string, event: object, token: string }`
- Validasi: token harus cocok dengan `SYSTEM_WUZAPI_TOKEN`
- Validasi: `event.Info.Chat` harus group JID yang terdaftar (`WHATSBOT_GROUP_JID`)
- Teruskan ke `lib/whatsapp-bot.ts`

### 2. Bot Processor (`lib/whatsapp-bot.ts`)

**handleGroupInfo(event)**:
- Payload key: `event.Join` (array of JID strings) — berisi JID user yang join
- Jika `event.Join` tidak kosong, untuk tiap JID:
  - Extract nomor WA dari JID
  - Kirim welcome via `/chat/send/text` (group JID `event.JID`)
- **Hanya proses jika `event.JID` == `WHATSBOT_GROUP_JID`** (grup yang ditargetkan)
- Welcome message: *"Halo! Selamat datang di grup Kapster — komunitas pengguna sistem antrian digital untuk salon pria. Aku bot Kapster 🤖 Untuk bertanya seputar Kapster, cukup kirim pesan dengan #ask atau #tanya ya. Selamat bergabung! 🎉"*

**handleMessage(event)**:
- Hanya proses jika `event.Info.Chat` == `WHATSBOT_GROUP_JID` (grup target)
- Hanya proses jika `event.Info.Sender` bukan bot sendiri (cek dari `SYSTEM_WA_PHONE`)
- Ekstrak teks dari `event.Message.conversation` (simple text) atau `event.Message.extendedTextMessage.text` (extended text) atau `event.Message.buttonsResponseMessage.selectedButtonId`
- Teks dikonversi ke lowercase untuk pengecekan hashtag
- Cek apakah mengandung `#ask` atau `#tanya`
- Jika tidak → skip (jangan reply apapun)
- Jika ya → extract pertanyaan (hapus `#ask`/`#tanya`), kirim ke Groq
- Jawaban Groq dikirim ke grup via WuzAPI (`/chat/send/text` dengan `Phone` = group JID)

### 3. Groq Client (`lib/groq.ts`)

- Endpoint: `POST https://api.groq.com/openai/v1/chat/completions`
- API Key: `GROQ_API_KEY`
- Model: `llama-3.3-70b-versatile`
- Max tokens: 500
- Temperature: 0.3

**System Prompt** (berisi full knowledge Kapster):

```
You are KapsterBot, an AI assistant for the Kapster community WhatsApp group.
Kapster is a digital queue management system for Indonesian barbershops.

RULES:
- ONLY answer questions related to Kapster (features, pricing, registration, business logic, feature requests)
- If the question is NOT about Kapster, respond politely:
  "Maaf, aku khusus membantu pertanyaan seputar Kapster. Ada yang bisa ditanyakan tentang fitur, harga, atau cara penggunaan Kapster? Ketik #ask atau #tanya ya 😊"
- Keep answers concise (max 200 words), suitable for WhatsApp
- Answer in Indonesian
- Be friendly and helpful

KAPSTER FACTS:
- Price: Rp10.000 per month (flat, all features included)
- No free trial available
- Features: digital queue management, online booking, WhatsApp notifications, multi-barber support, services management, analytics dashboard, TV customer display, public queue page, booking page
- How to register: go to kapster.my.id, create account, setup barbershop, subscribe
- Payment via Pakasir (no sensitive data handled by Kapster)
- Setup takes less than 5 minutes
- Customers don't need to install any app
- Queue status flow: waiting → called → serving → done
- Daily queue limit: 50 entries per day
- Booking window: default 7 days ahead
- WhatsApp notifications sent automatically for queue updates
- 500+ barbershops trust Kapster
- Contact: hello@kapster.my.id
```

## Konfigurasi WuzAPI (setelah deploy)

1. Update events system user:
   ```
   curl -X POST http://localhost:3004/session/connect \
     -H 'Token: NTdrmBAH5ogDFqGWmEeDpPd3R1nCXmmR' \
     -H 'Content-Type: application/json' \
     -d '{"Subscribe":["Message","ReadReceipt","GroupInfo"],"Immediate":false}'
   ```
   Ini akan disconnect → reconnect dengan event baru (termasuk GroupInfo).

2. Set webhook URL (dikerjakan di implementasi):
   ```
   curl -X POST http://localhost:3004/webhook \
     -H 'Token: NTdrmBAH5ogDFqGWmEeDpPd3R1nCXmmR' \
     -H 'Content-Type: application/json' \
     -d '{"webhookURL":"https://kapster.my.id/api/webhook/whatsapp","events":["Message","GroupInfo"]}'
   ```

## Error Handling

- Gagal kirim WA → log error via `logError`, jangan retry
- Gagal panggil Groq → log error, kirim pesan error ke grup
- Input tidak valid → return 200 (jangan retry webhook)
- Timeout Groq (30s) → kirim pesan "Maaf, lagi sibuk. Coba #tanya lagi ya"

## Env Vars

Tambahkan ke `.env.local`:
```
GROQ_API_KEY=<your-groq-api-key>
WHATSBOT_GROUP_JID=120363407853341919@g.us
```

## Testing

- Test webhook endpoint dengan curl POST simulasi payload
- Test Groq client dengan pertanyaan sample
- Test end-to-end: kirim pesan dengan #ask ke grup (via API WuzAPI simulasi)
- Test non-Kapster question → harus fallback
- Test pesan tanpa #ask/#tanya → harus skip

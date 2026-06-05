# 3 AI Agent System Design (Hustler, Hacker, Hipster)

## Business Context

- Investor (Ferdi) ingin sistem berjalan sustain dengan 3 AI agents
- Agents sebagai orchestrator yang bisa delegasi ke sub-agents
- Semua eksekusi, kendala, progress dilaporkan ke investor via Telegram
- Semua event-driven — error sistem, WA customer, complain, Telegram command
- Aplikasi: **kapster** — digital queue management untuk barbershop Indonesia

## LLM Model Allocation

| Agent | Model | Provider | Reason |
|---|---|---|---|
| **Hacker** | `deepseek/deepseek-v4-flash:free` | OpenRouter (via lib yang ada) | Reasoning & coding terkuat di free models, native chain-of-thought |
| **Hipster** | `qwen/qwen3-32b` | Groq (api.groq.com) | Kreatif, 500K token/hari, 662 tok/s, cocok untuk creative tasks |
| **Hustler** | `llama-3.3-70b-versatile` | Groq (api.groq.com) | All-rounder paling solid, business communication, udah terintegrasi |

## Architecture: Event Bus + Next.js Agent Worker

### Diagram Aliran

```
                        ┌──────────────────────────────────────┐
                        │         Ferdi (Telegram)              │
                        │  ┌────────────────────────────────┐   │
                        │  │ ← Report + tanya keputusan     │   │
                        │  │ → Command + feedback via inline │   │
                        │  └────────────────────────────────┘   │
                        └───────────┬──────────────────────────┘
                                    │
[Sources] ──→ [agent_events] ──→ [Agent Worker (PM2)] ──→ Telegram
    │                              │
    ├─ System errors              ├─ Router → decide target
    ├─ WhatsApp messages          ├─ Hacker Agent
    ├─ Customer complaints        ├─ Hipster Agent
    ├─ Ferdi's Telegram commands  ├─ Hustler Agent
    ├─ Cron/scheduled             └─ Sub-agents (spawn tsx)
    └─ App events

       ↻ Feedback loop: Ferdi reply → event baru → agent proses lagi
```

### `agent_events` Table Schema

| Column | Type | Description |
|---|---|---|
| id | uuid PK | |
| event_type | text | `system_error`, `wa_message`, `complaint`, `telegram_cmd`, `queue_event`, `signup`, `scheduled` |
| source | text | `system`, `whatsapp`, `feedback`, `telegram`, `app`, `cron` |
| payload | jsonb | Raw event data |
| priority | int | 1-5 (1=critical, 5=low) |
| target_agent | text | `hacker`, `hipster`, `hustler`, atau `null` (auto-route) |
| status | text | `pending` → `processing` → `processed` / `failed` |
| assigned_agent | text | Agent yang memproses |
| decision | jsonb | Hasil reasoning agent |
| actions_taken | jsonb[] | Actions yang dieksekusi |
| report_sent | boolean | Apakah sudah dilapor ke Telegram |
| notes | text | Ringkasan reasoning agent (konteks untuk event selanjutnya) |
| error | text | Error message jika gagal |
| created_at | timestamptz | |
| processed_at | timestamptz | |

### Agent Architecture

Setiap agent adalah class dengan pola seragam:

```
Agent {
  role: "hacker" | "hipster" | "hustler"
  model: LLM provider + model config
  systemPrompt: Role-specific
  tools: Tool[]
  
  async processEvent(event) → { decision, actions[] }
  async runTool(name, params) → result
  async reportToTelegram(message)
  async spawnSubAgent(task, context) → result
}
```

### Tool Access per Agent

**Internal tools** (otomatis, tanpa intervensi manusia):

| Agent | Tools |
|---|---|
| **Hacker** | `exec_sql`, `exec_command`, `read_logs`, `check_metrics`, `manage_cron`, `trigger_deploy`, `restart_service`, `generate_tool` |
| **Hipster** | `send_whatsapp`, `edit_template`, `generate_content`, `read_feedback`, `check_brand_consistency`, `search_trends` |
| **Hustler** | `send_wa_promo`, `get_analytics`, `track_referrals`, `get_customer_stats`, `send_engagement`, `search_web` |

**External tools** (butuh akses ke luar sistem):
- `search_web` — cari informasi/trend di internet (web search API)
- `research_trends` — riset tren social media, topik viral
- `scrape_url` — ambil konten dari URL eksternal
- Semua agent punya akses ke tools ini

**Shared tools** (semua agent):
- `request_ferdi_action` — minta Ferdi melakukan sesuatu di luar kemampuan agent
- `search_web` — web search untuk riset
- `generate_tool` — Hacker bisa bikin tool baru untuk agent lain
- `send_telegram` — kirim pesan ke Telegram (report, tanya keputusan)

### Dynamic Tool Generation

Tool tidak terbatas pada daftar static. **Hacker bisa generate tool baru** untuk agent mana pun:

1. Hacker nulis kode tool baru (function + schema)
2. Register via `generate_tool` — tool otomatis tersedia di sistem
3. Langsung bisa dipakai oleh agent yang dituju

Flow:
```
Hustler: "I need to track competitor prices"
Hacker: generate_tool("track_competitor_prices", { source, keyword }) 
        → tool terdaftar → Hustler langsung bisa pake
```

### Investor Feedback Loop (Telegram Inline)

Sama seperti flow approve blog existing — ketika agent butuh keputusan Ferdi:

1. Agent kirim pesan ke Telegram dengan inline buttons:
   ```
   ┌─ Hacker Agent — ⚠️ Butuh Keputusan
   ├ DB migration baru: add_feature_x.sql
   ├ Risiko: downtime ~2 menit
   ├ Waktu: sekarang (traffic rendah)
   └─ [✅ Lanjutkan] [❌ Batalkan] [✏️ Jadwalkan ulang]
   ```
2. Ferdi klik button → callback dikirim ke webhook Telegram → jadi event baru
3. Agent lanjut proses berdasarkan feedback

**Format standar untuk semua "tanya keputusan":**
- Judul jelas dengan prefix agent
- Konteks: apa yang terjadi, opsi yang tersedia
- Inline buttons: minimal Approve/Reject, tambahan sesuai konteks

### Human-in-the-loop (Ferdi Action)

Ketika agent butuh sesuatu di luar kemampuan digitalnya:

Tool `request_ferdi_action` tersedia untuk semua agent:
1. Agent kirim instruksi detail ke Ferdi via Telegram
2. Sertakan: apa yang harus dilakukan, kenapa, format response yang diharapkan
3. Ferdi selesai → reply ke Telegram → trigger event baru
4. Agent lanjut proses

Contoh:
```
┌─ Hacker Agent — 🔑 Butuh API Key
├ Platform: Instagram Graph API
├ Tujuan: Buat tool posting konten otomatis
├ Langkah: 1. Buka https://developers.facebook.com
│          2. Buat app → ambil access token
│          3. Kirim token ke sini
└─ [✅ Udah dikirim] [❌ Skip aja]
```

### Agent Decision Loop

1. **Worker** polling `agent_events` setiap ~5 detik, ambil batch 5 event priority tertinggi
2. **Router** menentukan target agent:
   - `system_error` → Hacker
   - `complaint`, `feedback` → Hipster
   - `queue_event`, `signup` → Hustler
   - `wa_message` → LLM classification based on content
   - `telegram_cmd` → parsed from command prefix (`@hacker`, `@hipster`, `@hustler`)
3. **Agent Reasoning**: construct prompt (event data + role context + tool list) → LLM call
4. **Tool Execution**: run tool calls sequentially
5. **Update**: set decision, actions_taken, status di `agent_events`
6. **Report**: kirim laporan ke Telegram dengan format terstruktur

### Retry & Error Handling

- Tool call gagal → agent decide retry (max 3) atau escalate
- 3 gagal → `status: failed` + lapor ke Ferdi via Telegram
- Scalate ke investor untuk decision manual jika perlu

### Two-Way Telegram Communication

**Ferdi → Agent (Commands):**
- `@hacker check why deploy failed` → langsung ke Hacker
- `@hipster review feedback hari ini` → langsung ke Hipster
- `@hustler laporan revenue minggu ini` → langsung ke Hustler
- Tanpa prefix → auto-route by content
- Reply ke pesan agent → dianggap feedback untuk agent tersebut

**Agent → Ferdi (Reports & Questions):**
- Laporan hasil eksekusi (format terstruktur)
- Tanya keputusan (dengan inline buttons: ✅/❌/✏️)
- Minta action fisik (request_ferdi_action)
- Laporan periodik (daily/weekly)

**Callback flow:**
1. Ferdi klik inline button → Telegram kirim callback ke webhook
2. Webhook insert event baru ke `agent_events` dengan `source: "telegram"` dan `event_type: "feedback"`
3. Agent yang relevan process feedback tersebut
4. Agent lanjutkan eksekusi atau adjust decision

### Laporan Periodik

- **Hacker**: Daily health report (error rate, uptime, resource usage)
- **Hipster**: Weekly feedback summary (sentimen customer, top issues)
- **Hustler**: Weekly business report (barbershop growth, queue volume, engagement)

Semua laporan dikirim ke Telegram group/private chat.

### Worker Runtime

`scripts/agent-worker.ts` — PM2 process:

```js
// ecosystem.config.js addition
{
  name: "agent-worker",
  script: "scripts/agent-worker.ts",
  interpreter: "npx",
  interpreterArgs: "tsx",
  restart_delay: 5000,
  max_restarts: 10
}
```

Worker adalah pure event loop — tanpa HTTP/express. Polling `agent_events` → process → report.

### Memory Management

- Zero in-memory state — semua state di PostgreSQL (`agent_events` + existing tables)
- Setiap agent punya `notes` field di `agent_events` — ringkasan hasil reasoning-nya disimpen sebagai konteks buat event selanjutnya
- Agent bisa query `agent_events` dengan `source` atau `event_type` tertentu untuk konteks event sebelumnya
- Server restart aman — gak ada state yang ilang

### Sub-agent System

Agent bisa delegasi tugas ke sub-agent dalam 2 mode:
1. **Sub-event** (delegasi internal) — agent insert event baru ke `agent_events` dengan `target_agent` yang ditentukan, untuk tugas yang masih dalam lingkup agent system
2. **Child process** (task berat/long-running) — agent spawn `npx tsx script.ts` persis seperti existing cron scripts, untuk tugas di luar lingkup agent system (misal: generate blog, SEO audit, backup)

Sub-event flow:
```
Hacker dapet system_error → insert sub-event "db_health_check" → worker process sub-event → return result
```

### Integration Points

Existing code that feeds into `agent_events`:
1. Error logger (`lib/error-logger.ts`) → insert `system_error` event
2. WhatsApp webhook (`app/api/webhook/whatsapp/route.ts`) → insert `wa_message` event
3. Feedback submission → insert `complaint` event
4. Telegram webhook (`app/api/telegram/webhook/route.ts`) → parse commands, insert `telegram_cmd` event
5. Existing cron jobs → can also insert `scheduled` events

### Files to Create

| File | Purpose |
|---|---|---|
| `supabase/migrations/add_agent_events.sql` | Create `agent_events` table |
| `scripts/agent-worker.ts` | Main worker entry point |
| `lib/agents/base-agent.ts` | Base Agent class + decision loop |
| `lib/agents/hacker-agent.ts` | Hacker agent implementation + tool generation |
| `lib/agents/hipster-agent.ts` | Hipster agent implementation |
| `lib/agents/hustler-agent.ts` | Hustler agent implementation |
| `lib/agents/router.ts` | Event router + auto-classification |
| `lib/agents/types.ts` | Shared types |
| `lib/agents/tools/shared-tools.ts` | Shared tools (search_web, request_ferdi_action, dll) |
| `lib/agents/tools/hacker-tools.ts` | Hacker tool implementations |
| `lib/agents/tools/hipster-tools.ts` | Hipster tool implementations |
| `lib/agents/tools/hustler-tools.ts` | Hustler tool implementations |
| `lib/agents/self-improve.ts` | Retrospective & self-improvement logic |
| `lib/agents/llm.ts` | LLM client wrapper (Groq + OpenRouter) |

### Self-Improvement System

Agent harus bisa improve diri sendiri tanpa campur tangan manusia.

**Mekanisme:**
1. **After-action review** — setiap agent evaluasi hasil kerjanya setelah proses event:
   - Apa yang berjalan baik?
   - Apa yang salah?
   - Apa yang bisa diperbaiki next time?
   - Catatan disimpan di `notes` field
2. **Scheduled retrospective** — event periodik (mingguan) yang memicu:
   - Hacker review log performa semua agent
   - Hacker generate improved system prompts berdasarkan pola error/kegagalan
   - Update prompt agent lain jika perlu
   - Laporkan perubahan ke Ferdi
3. **Pattern detection** — agent detect pola berulang:
   - Error yang sama muncul terus → Hacker bikin automation tetap
   - Feedback customer seragam → Hipster update template/tone
   - Opportunity berulang → Hustler bikin campaign otomatis
4. **Tool evolution** — Hacker bisa deprecate tool yang gak efektif, bikin tool baru yang lebih baik

**Trigger self-improvement:**
- `scheduled` event tiap minggu: `agent_retrospective`
- Ferdi bisa trigger manual via: `@hacker run retrospective`

### Anti-Failure

- Worker crash → PM2 auto-restart (max 10x, 5s delay)
- Processing timeout → event marked as `failed` after 5 minutes
- Event tetap di DB — gak ada data loss
- Semua tools punya timeout sendiri-sendiri
- LLM call failure → retry with different model (fallback)

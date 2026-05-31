# WhatsApp Bot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a WhatsApp bot for the Kapster community group that auto-welcomes new members and answers Kapster questions via Groq when users use #ask or #tanya.

**Architecture:** WuzAPI sends webhooks (Message, GroupInfo events) to a Next.js API route; the route parses the event type and delegates to a bot processor that either sends a welcome (via WuzAPI) or queries Groq LLM and responds.

**Tech Stack:** Next.js 16 (App Router), WuzAPI REST API, Groq SDK, TypeScript

**Files to create/modify:**
- Create: `lib/groq.ts` — Groq API client
- Create: `lib/whatsapp-bot.ts` — bot processor (welcome + Q&A)
- Create: `app/api/webhook/whatsapp/route.ts` — webhook HTTP endpoint
- Modify: `.env.local` — add env vars
- Modify: `lib/wuzapi.ts` — add `getGroupJidFromPhone` helper (if needed)

**Prerequisites:**
- System WuzAPI user already exists and is admin of the community group (JID: `120363407853341919@g.us`)
- Token: `NTdrmBAH5ogDFqGWmEeDpPd3R1nCXmmR`
- Admin token: `14fa7c855278a677784fa71083012060`
- WuzAPI base URL: `https://wa.linkjo.my.id` (port 3004 locally)
- Groq API key: `<your-groq-api-key>`

---

### Task 1: Create Groq Client (`lib/groq.ts`)

**Files:**
- Create: `lib/groq.ts`
- Read reference: `lib/wuzapi.ts` (for error logging pattern)

- [ ] **Step 1: Create lib/groq.ts**

```typescript
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

const SYSTEM_PROMPT = `You are KapsterBot, an AI assistant for the Kapster community WhatsApp group. Kapster is a digital queue management system for Indonesian barbershops.

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
- Contact: hello@kapster.my.id`;

export async function askGroq(question: string): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not set");
  }

  const res = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: question },
      ],
      max_tokens: 500,
      temperature: 0.3,
    }),
    signal: AbortSignal.timeout(30000),
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => "");
    throw new Error(`Groq API error ${res.status}: ${errorText}`);
  }

  const data = await res.json();
  const answer: string =
    data.choices?.[0]?.message?.content || "Maaf, aku tidak bisa menjawab pertanyaan itu.";
  return answer;
}
```

- [ ] **Step 2: Verify file compiles**

Run: `npx tsc --noEmit lib/groq.ts`
Expected: No type errors (it may show errors for missing `process.env` but that's fine since Next.js brings its own env types)

---

### Task 2: Create Bot Processor (`lib/whatsapp-bot.ts`)

**Files:**
- Create: `lib/whatsapp-bot.ts`
- Read: `lib/wuzapi.ts` — for `sendTextMessage` and `SYSTEM_WUZAPI_TOKEN`
- Read: `lib/error-logger.ts` — for `logError`

- [ ] **Step 1: Create lib/whatsapp-bot.ts**

```typescript
import { sendTextMessage, SYSTEM_WUZAPI_TOKEN, SYSTEM_WA_PHONE } from "@/lib/wuzapi";
import { askGroq } from "@/lib/groq";
import { logError } from "@/lib/error-logger";

const GROUP_JID = process.env.WHATSBOT_GROUP_JID || "120363407853341919@g.us";

function extractJidPhone(jid: string): string {
  return jid.split(":")[0].split("@")[0];
}

function extractText(event: Record<string, unknown>): string {
  const msg = event.Message as Record<string, unknown> | undefined;
  if (!msg) return "";

  const conversation = msg.conversation as string | undefined;
  if (conversation) return conversation;

  const extended = msg.extendedTextMessage as Record<string, unknown> | undefined;
  if (extended?.text) return extended.text as string;

  return "";
}

function hasAskTag(text: string): boolean {
  const lower = text.toLowerCase();
  return lower.includes("#ask") || lower.includes("#tanya");
}

function stripTag(text: string): string {
  return text.replace(/#ask/gi, "").replace(/#tanya/gi, "").trim();
}

export async function handleGroupInfo(event: Record<string, unknown>): Promise<void> {
  try {
    const groupJid = event.JID as string | undefined;
    if (groupJid !== GROUP_JID) return;

    const joinList = event.Join as string[] | undefined;
    if (!joinList || joinList.length === 0) return;

    const token = SYSTEM_WUZAPI_TOKEN;
    if (!token) return;

    for (const jid of joinList) {
      const phone = extractJidPhone(jid);
      const pushName = (event as Record<string, unknown>).Notify as string || "";

      const welcomeMessage =
        `Halo${pushName ? " " + pushName : ""}! Selamat datang di grup Kapster — komunitas pengguna sistem antrian digital untuk salon pria. Aku bot Kapster 🤖 Untuk bertanya seputar Kapster, cukup kirim pesan dengan #ask atau #tanya ya. Selamat bergabung! 🎉`;

      await sendTextMessage(token, groupJid, welcomeMessage);
    }
  } catch (err) {
    logError("handleGroupInfo", err, { event });
  }
}

export async function handleMessage(event: Record<string, unknown>): Promise<void> {
  try {
    const groupJid = (event.Info as Record<string, unknown> | undefined)?.Chat as string | undefined;
    if (groupJid !== GROUP_JID) return;

    const senderJid = (event.Info as Record<string, unknown> | undefined)?.Sender as string | undefined;
    if (senderJid && extractJidPhone(senderJid) === SYSTEM_WA_PHONE) return;

    const text = extractText(event as Record<string, unknown>);
    if (!text) return;

    if (!hasAskTag(text)) return;

    const question = stripTag(text);
    const token = SYSTEM_WUZAPI_TOKEN;
    if (!token) return;

    const answer = await askGroq(question);

    await sendTextMessage(token, groupJid, answer);
  } catch (err) {
    logError("handleMessage", err, { event });
    // Try to send error message to group
    try {
      const groupJid = (event.Info as Record<string, unknown> | undefined)?.Chat as string | undefined;
      if (groupJid && SYSTEM_WUZAPI_TOKEN) {
        await sendTextMessage(
          SYSTEM_WUZAPI_TOKEN,
          groupJid,
          "Maaf, aku lagi sibuk. Coba #tanya lagi ya 😊"
        );
      }
    } catch {
      // silent
    }
  }
}
```

- [ ] **Step 2: Verify file compiles**

Run: `npx tsc --noEmit lib/whatsapp-bot.ts 2>&1 | head -20`
Expected: No hard type errors (expect some ambient type warnings, that's fine)

---

### Task 3: Create Webhook Endpoint (`app/api/webhook/whatsapp/route.ts`)

**Files:**
- Create: `app/api/webhook/whatsapp/route.ts`
- Read: `app/api/webhook/pakasir/route.ts` — for existing webhook pattern reference
- Read: `app/actions/notifications.ts` — for server action pattern

- [ ] **Step 1: Create the API route**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { SYSTEM_WUZAPI_TOKEN } from "@/lib/wuzapi";
import { handleGroupInfo, handleMessage } from "@/lib/whatsapp-bot";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { type, event, token } = body;

  if (token !== SYSTEM_WUZAPI_TOKEN) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!event || typeof event !== "object") {
    return NextResponse.json({ error: "invalid event" }, { status: 400 });
  }

  // Fire-and-forget: don't block webhook response
  if (type === "GroupInfo") {
    handleGroupInfo(event).catch(() => {});
  } else if (type === "Message") {
    handleMessage(event).catch(() => {});
  }

  return NextResponse.json({ received: true });
}

// WuzAPI sends GET for webhook health checks
export async function GET() {
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 2: Verify compiles**

Run: `npx tsc --noEmit app/api/webhook/whatsapp/route.ts 2>&1 | head -20`
Expected: No type errors

---

### Task 4: Add Env Vars and Deploy

**Files:**
- Modify: `.env.local`
- Execute on VPS

- [ ] **Step 1: Add env vars to local .env.local**

Append to `.env.local`:
```
GROQ_API_KEY=<your-groq-api-key>
WHATSBOT_GROUP_JID=120363407853341919@g.us
```

- [ ] **Step 2: Deploy to VPS**

```bash
cd /home/ferdifir/development/kapster
git add .
git commit -m "feat: add whatsapp bot for community group"
git push origin main
```

Then SSH to VPS:
```bash
ssh -p 38954 root@109.111.53.58
cd /var/www/kapster  # or wherever kapster is deployed
git pull origin main
# Add env vars to .env
echo 'GROQ_API_KEY=<your-groq-api-key>' >> .env
echo 'WHATSBOT_GROUP_JID=120363407853341919@g.us' >> .env
# Restart PM2
pm2 restart kapster
```

Check deployment:
```bash
pm2 logs kapster --lines 20
```

- [ ] **Step 3: Test webhook endpoint**

```bash
# From VPS or local, test the endpoint
curl -X POST https://kapster.my.id/api/webhook/whatsapp \
  -H 'Content-Type: application/json' \
  -d '{"type":"Message","event":{"Info":{"Chat":"120363407853341919@g.us","Sender":"6285239110184@s.whatsapp.net"},"Message":{"conversation":"#ask harga kapster berapa"}},"token":"NTdrmBAH5ogDFqGWmEeDpPd3R1nCXmmR"}'
```

Expected: Returns `{"received":true}` and bot sends answer to group

- [ ] **Step 4: Check PM2 logs**

```bash
pm2 logs kapster --lines 50
```

Verify: No error logs, webhook processing was successful

---

### Task 5: Configure WuzAPI Webhook and Events

**Execute on VPS:**

- [ ] **Step 1: Set webhook URL for system user**

```bash
ssh -p 38954 root@109.111.53.58
curl -X POST http://localhost:3004/webhook \
  -H 'Token: NTdrmBAH5ogDFqGWmEeDpPd3R1nCXmmR' \
  -H 'Content-Type: application/json' \
  -d '{"webhookURL":"https://kapster.my.id/api/webhook/whatsapp"}'
```

Expected: `{"code":200,"data":{"webhook":"https://kapster.my.id/api/webhook/whatsapp"},"success":true}`

- [ ] **Step 2: Update events subscription to include GroupInfo**

```bash
curl -X POST http://localhost:3004/session/connect \
  -H 'Token: NTdrmBAH5ogDFqGWmEeDpPd3R1nCXmmR' \
  -H 'Content-Type: application/json' \
  -d '{"Subscribe":["Message","ReadReceipt","GroupInfo"],"Immediate":false}'
```

Expected: `{"code":200,"data":{"details":"Connected!","events":"Message,ReadReceipt,GroupInfo","jid":"...","webhook":"https://kapster.my.id/api/webhook/whatsapp"},"success":true}`

- [ ] **Step 3: Verify webhook is working**

```bash
curl -s http://localhost:3004/webhook -H 'Token: NTdrmBAH5ogDFqGWmEeDpPd3R1nCXmmR'
```

Expected: Shows configured webhook URL and events

---

### End-to-End Verification

1. Send a message with `#ask` to the community group via WhatsApp
2. Verify bot replies within a few seconds
3. Send a message without `#ask` — verify no bot response
4. Send a non-Kapster question with `#ask` — verify bot politely redirects
5. Add someone new to the group — verify welcome message is sent

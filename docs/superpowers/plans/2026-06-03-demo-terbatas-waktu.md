# Demo Terbatas Waktu Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Time-limited demo (15 min) via WhatsApp request, single account (Fred), waitlist with auto-notify

**Architecture:** WuzAPI webhook receives "demo" messages → Next.js API processes session/waitlist → Supabase Auth password cycling for security. pg_cron runs cleanup every 60s.

**Tech Stack:** Next.js 16, Supabase (Auth + DB + pg_cron), WuzAPI (WhatsApp gateway)

---

## File Structure

| File | Action | Responsibility |
|------|--------|---------------|
| `lib/demo.ts` | Create | Core demo logic: password gen, session CRUD, waitlist, WhatsApp replies |
| `app/api/webhook/whatsapp/route.ts` | Modify | Add private message handler for "demo" template |
| `app/api/cron/demo-cleanup/route.ts` | Create | Expire sessions + notify waitlist, protected by CRON_SECRET |
| `supabase/migrations/20260603000001_demo_tables.sql` | Create | `demo_sessions` + `demo_waitlist` tables |
| `supabase/migrations/20260603000002_demo_cron.sql` | Create | Schedule pg_cron job every 60s |

---

### Task 1: Database Migration — demo_sessions + demo_waitlist

**Files:**
- Create: `supabase/migrations/20260603000001_demo_tables.sql`

- [ ] **Step 1: Write migration**

```sql
-- supabase/migrations/20260603000001_demo_tables.sql

CREATE TABLE public.demo_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL,
  temp_password TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired')),
  created_at TIMESTAMPTZ DEFAULT now(),
  claimed_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.demo_sessions ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.demo_waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL,
  notified_at TIMESTAMPTZ,
  status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'notified', 'claimed', 'expired')),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.demo_waitlist ENABLE ROW LEVEL SECURITY;
```

- [ ] **Step 2: Run migration via Supabase**

Run: `rtk psql "$DATABASE_URL" -f supabase/migrations/20260603000001_demo_tables.sql`

Expected: `CREATE TABLE` x2, `ALTER TABLE` x2

- [ ] **Step 3: Verify tables exist**

Run: `rtk psql "$DATABASE_URL" -c "\dt public.demo_*"`

Expected: both tables listed

- [ ] **Step 4: Commit**

---

### Task 2: Core Logic — lib/demo.ts

**Files:**
- Create: `lib/demo.ts`

This module contains all demo business logic. Uses admin Supabase client (service_role) for password resets and DB queries.

**Constants:**
- `DEMO_USER_ID = "0cb5f9fb-0930-46d3-bb4b-fb8030668d66"` — Fred's auth.users.id
- `DEMO_EMAIL = "demo@kapster.my.id"`
- `DEMO_SESSION_MINUTES = 15`
- `WAITLIST_CLAIM_MINUTES = 2`

- [ ] **Step 1: Write lib/demo.ts**

```typescript
import { createAdminClient } from "@/lib/supabase/admin";
import { sendTextMessage, SYSTEM_WUZAPI_TOKEN } from "@/lib/wuzapi";
import { logError } from "@/lib/error-logger";

const DEMO_USER_ID = "0cb5f9fb-0930-46d3-bb4b-fb8030668d66";
const DEMO_EMAIL = "demo@kapster.my.id";
const DEMO_SESSION_MINUTES = 15;
const WAITLIST_CLAIM_MINUTES = 2;

export function generatePassword(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%";
  let result = "Demo@";
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function extractJidPhone(jid: string): string {
  return jid.split(":")[0].split("@")[0];
}

export function extractText(event: Record<string, unknown>): string {
  const msg = event.Message as Record<string, unknown> | undefined;
  if (!msg) return "";
  const conversation = msg.conversation as string | undefined;
  if (conversation) return conversation;
  const extended = msg.extendedTextMessage as Record<string, unknown> | undefined;
  if (extended?.text) return extended.text as string;
  return "";
}

export function isPrivateMessage(event: Record<string, unknown>): boolean {
  const info = event.Info as Record<string, unknown> | undefined;
  const chat = info?.Chat as string | undefined;
  return !!chat && !chat.includes("@g.us");
}

export function getSenderPhone(event: Record<string, unknown>): string | null {
  const info = event.Info as Record<string, unknown> | undefined;
  const sender = info?.Sender as string | undefined;
  if (!sender) return null;
  return extractJidPhone(sender);
}

export function getChatJid(event: Record<string, unknown>): string | null {
  const info = event.Info as Record<string, unknown> | undefined;
  return (info?.Chat as string) || null;
}

export async function setDemoPassword(password: string): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(DEMO_USER_ID, { password });
  if (error) throw new Error(`Failed to set demo password: ${error.message}`);
}

export async function getActiveSession(): Promise<{
  id: string;
  phone: string;
  expires_at: string;
} | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("demo_sessions")
    .select("id, phone, expires_at")
    .eq("status", "active")
    .single();

  if (error && error.code !== "PGRST116") {
    logError("getActiveSession", error);
  }
  return data || null;
}

export async function createSession(
  phone: string,
  password: string
): Promise<{ id: string; expires_at: string }> {
  const expiresAt = new Date(Date.now() + DEMO_SESSION_MINUTES * 60 * 1000).toISOString();
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("demo_sessions")
    .insert({
      phone,
      temp_password: password,
      expires_at: expiresAt,
      status: "active",
      claimed_at: new Date().toISOString(),
    })
    .select("id, expires_at")
    .single();

  if (error) throw new Error(`Failed to create session: ${error.message}`);
  return data;
}

export async function addToWaitlist(phone: string): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin.from("demo_waitlist").insert({ phone, status: "waiting" });
  if (error) logError("addToWaitlist", error);
}

export async function isInWaitlist(phone: string): Promise<boolean> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("demo_waitlist")
    .select("id")
    .eq("phone", phone)
    .in("status", ["waiting", "notified"])
    .maybeSingle();
  return !!data;
}

export async function hasNotifiedStatus(phone: string): Promise<boolean> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("demo_waitlist")
    .select("id")
    .eq("phone", phone)
    .eq("status", "notified")
    .maybeSingle();
  return !!data;
}

export async function claimFromNotified(
  phone: string,
  password: string
): Promise<{ id: string; expires_at: string }> {
  const admin = createAdminClient();

  const { error: delErr } = await admin
    .from("demo_waitlist")
    .delete()
    .eq("phone", phone)
    .eq("status", "notified");

  if (delErr) logError("claimFromNotified delete", delErr);

  return createSession(phone, password);
}

export async function sendWaMessage(phone: string, message: string): Promise<void> {
  const token = SYSTEM_WUZAPI_TOKEN;
  if (!token) return;
  await sendTextMessage(token, phone, message);
}

export function formatEta(expiresAt: string): string {
  const remaining = Math.ceil(
    (new Date(expiresAt).getTime() - Date.now()) / 60000
  );
  const endTime = new Date(expiresAt).toLocaleTimeString("id-ID", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
  });
  return `~${remaining} menit (sekitar ${endTime} WIB)`;
}

export async function expireSession(sessionId: string): Promise<void> {
  const admin = createAdminClient();

  const newPassword = generatePassword();
  await setDemoPassword(newPassword);

  const { error } = await admin
    .from("demo_sessions")
    .update({ status: "expired", temp_password: newPassword })
    .eq("id", sessionId);

  if (error) logError("expireSession", error);
}

export async function processWaitlist(): Promise<void> {
  const admin = createAdminClient();

  // 1. Find & expire active sessions past their expiry
  const { data: expiredSessions } = await admin
    .from("demo_sessions")
    .select("id")
    .eq("status", "active")
    .lt("expires_at", new Date().toISOString());

  if (expiredSessions && expiredSessions.length > 0) {
    for (const session of expiredSessions) {
      await expireSession(session.id);
    }

    // 2. Notify next in waitlist
    const { data: nextInLine } = await admin
      .from("demo_waitlist")
      .select("id, phone")
      .eq("status", "waiting")
      .order("created_at")
      .limit(1);

    if (nextInLine && nextInLine.length > 0) {
      const entry = nextInLine[0];
      const { error } = await admin
        .from("demo_waitlist")
        .update({ status: "notified", notified_at: new Date().toISOString() })
        .eq("id", entry.id);

      if (!error) {
        const jid = `${entry.phone}@s.whatsapp.net`;
        await sendWaMessage(
          jid,
          `🔔 Akun demo sudah siap!\nKetik *demo* dalam ${WAITLIST_CLAIM_MINUTES} menit untuk mendapatkan akses.`
        );
      }
    }
  }

  // 3. Expire waitlist entries past the claim window
  const cutoff = new Date(
    Date.now() - WAITLIST_CLAIM_MINUTES * 60 * 1000
  ).toISOString();

  await admin
    .from("demo_waitlist")
    .update({ status: "expired" })
    .eq("status", "notified")
    .lt("notified_at", cutoff);
}

async function removeFromWaitlist(phone: string): Promise<void> {
  const admin = createAdminClient();
  await admin.from("demo_waitlist").delete().eq("phone", phone);
}

export async function handleDemoRequest(event: Record<string, unknown>): Promise<void> {
  try {
    const text = extractText(event);
    const lower = text.trim().toLowerCase();
    const phone = getSenderPhone(event);
    const chatJid = getChatJid(event);
    if (!phone || !chatJid) return;

    if (lower === "batal") {
      const wasWaiting = await isInWaitlist(phone);
      if (wasWaiting) {
        await removeFromWaitlist(phone);
        await sendWaMessage(chatJid, "Baik, kamu sudah dihapus dari antrian demo.");
      }
      return;
    }

    if (lower !== "demo") return;

    const activeSession = await getActiveSession();

    if (activeSession) {
      const alreadyWaiting = await isInWaitlist(phone);
      if (alreadyWaiting) {
        await sendWaMessage(
          chatJid,
          "Kamu sudah dalam antrian, sabar ya 🙏"
        );
        return;
      }

      await addToWaitlist(phone);
      const eta = formatEta(activeSession.expires_at);
      await sendWaMessage(
        chatJid,
        `⏳ Masih ada yang menggunakan akun demo.\nTersedia dalam ${eta}.\nKami akan kabari otomatis ketika sudah siap!\nBalas *batal* jika tidak jadi.`
      );
      return;
    }

    const isNotified = await hasNotifiedStatus(phone);
    const password = generatePassword();
    await setDemoPassword(password);

    if (isNotified) {
      await claimFromNotified(phone, password);
    } else {
      await createSession(phone, password);
    }

    const expiresAt = new Date(Date.now() + DEMO_SESSION_MINUTES * 60 * 1000);
    await sendWaMessage(
      chatJid,
      `✅ *Akun Demo Kapster siap!*\n\nEmail: ${DEMO_EMAIL}\nPassword: ${password}\nLogin: https://kapster.my.id/auth/login\n\n⏱ Berlaku ${DEMO_SESSION_MINUTES} menit (sampai ${expiresAt.toLocaleTimeString("id-ID", { timeZone: "Asia/Jakarta", hour: "2-digit", minute: "2-digit" })} WIB)`
    );
  } catch (err) {
    logError("handleDemoRequest", err, { event });
  }
}
```

- [ ] **Step 2: Verify no TypeScript errors**

Run: `npx tsc --noEmit --pretty 2>&1 | head -30`

Expected: No errors related to `lib/demo.ts`

- [ ] **Step 3: Commit**

---

### Task 3: Update Webhook — Handle Private "demo" Messages

**Files:**
- Modify: `app/api/webhook/whatsapp/route.ts`

- [ ] **Step 1: Modify webhook route to add demo handler**

Add demo import and private message routing:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { SYSTEM_WUZAPI_TOKEN } from "@/lib/wuzapi";
import { handleGroupInfo, handleMessage } from "@/lib/whatsapp-bot";
import { handleDemoRequest, isPrivateMessage } from "@/lib/demo";
import { logError } from "@/lib/error-logger";

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch (err) {
    logError("webhook_whatsapp", err, { bodyRaw: await req.text().catch(() => "") });
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const { type, event, token } = body;

  if (token !== SYSTEM_WUZAPI_TOKEN) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!event || typeof event !== "object") {
    return NextResponse.json({ error: "invalid event" }, { status: 400 });
  }

  if (type === "GroupInfo") {
    handleGroupInfo(event as Record<string, unknown>).catch((err) => {
      logError("webhook_whatsapp_groupinfo", err);
    });
  } else if (type === "Message") {
    if (isPrivateMessage(event as Record<string, unknown>)) {
      handleDemoRequest(event as Record<string, unknown>).catch((err) => {
        logError("webhook_whatsapp_demo", err);
      });
    } else {
      handleMessage(event as Record<string, unknown>).catch((err) => {
        logError("webhook_whatsapp_message", err);
      });
    }
  } else {
    console.log(`[Webhook] Unknown event type: ${type}`);
  }

  return NextResponse.json({ received: true });
}

export async function GET() {
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 2: Verify no TypeScript errors**

Run: `npx tsc --noEmit --pretty 2>&1 | head -30`

Expected: No errors

- [ ] **Step 3: Commit**

---

### Task 4: Cron Endpoint — Session Cleanup + Waitlist Notify

**Files:**
- Create: `app/api/cron/demo-cleanup/route.ts`

- [ ] **Step 1: Write cron endpoint**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { processWaitlist } from "@/lib/demo";

const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: NextRequest) {
  const auth = request.headers.get("authorization")?.replace("Bearer ", "");
  if (auth !== CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await processWaitlist();
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[Cron] demo-cleanup failed:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Verify no TypeScript errors**

Run: `npx tsc --noEmit --pretty 2>&1 | head -30`

Expected: No errors

- [ ] **Step 3: Commit**

---

### Task 5: pg_cron Schedule — Demo Cleanup Every 60s

**Files:**
- Create: `supabase/migrations/20260603000002_demo_cron.sql`

- [ ] **Step 1: Write cron migration**

```sql
-- supabase/migrations/20260603000002_demo_cron.sql
-- Schedule demo session cleanup every 60 seconds

SELECT cron.schedule(
  'demo-cleanup-job',
  '* * * * *',
  $$
    SELECT net.http_post(
      url := 'https://kapster.my.id/api/cron/demo-cleanup',
      headers := jsonb_build_object(
        'Authorization', 'Bearer kpBlogGen2026!',
        'Content-Type', 'application/json'
      ),
      body := '{}'
    );
  $$
);
```

- [ ] **Step 2: Run migration**

Run: `rtk psql "$DATABASE_URL" -f supabase/migrations/20260603000002_demo_cron.sql`

Expected: `cron.schedule` returns a bigint job ID

- [ ] **Step 3: Verify cron is scheduled**

Run: `rtk psql "$DATABASE_URL" -c "SELECT jobname, schedule FROM cron.job WHERE jobname = 'demo-cleanup-job';"`

Expected: one row with `demo-cleanup-job` and `* * * * *`

- [ ] **Step 4: Commit**

---

### Task 6: Setup Demo Account — Update Fred to Demo Data

- [ ] **Step 1: Update auth email**

Run: `rtk psql "$DATABASE_URL" -c "UPDATE auth.users SET email = 'demo@kapster.my.id', email_change = '', email_change_token_current = '', email_change_token_new = '', email_change_confirm_status = 0 WHERE id = '0cb5f9fb-0930-46d3-bb4b-fb8030668d66' AND email = 'ferdifir.dev@gmail.com';"`

Expected: `UPDATE 1`

- [ ] **Step 2: Update profile**

Run: `rtk psql "$DATABASE_URL" -c "UPDATE public.profiles SET full_name = 'Demo Kapster', phone = '62881027979168' WHERE id = '0cb5f9fb-0930-46d3-bb4b-fb8030668d66';"`

Expected: `UPDATE 1`

- [ ] **Step 3: Verify changes**

Run: `rtk psql "$DATABASE_URL" -c "SELECT id, email FROM auth.users WHERE id = '0cb5f9fb-0930-46d3-bb4b-fb8030668d66';"`
Run: `rtk psql "$DATABASE_URL" -c "SELECT id, full_name, phone FROM public.profiles WHERE id = '0cb5f9fb-0930-46d3-bb4b-fb8030668d66';"`

Expected: email = `demo@kapster.my.id`, full_name = `Demo Kapster`, phone = `62881027979168`

- [ ] **Step 4: Commit**

---

### Task 7: Testing (Playwright MCP)

- [ ] **Step 1: Test webhook handler — request demo**

Simulate webhook payload via curl to verify "demo" request creates a session:

Run: `curl -X POST https://kapster.my.id/api/webhook/whatsapp -H "Content-Type: application/json" -d '{"type":"Message","event":{"Info":{"Chat":"628123456789@s.whatsapp.net","Sender":"628123456789@s.whatsapp.net"},"Message":{"conversation":"demo"}},"token":"'$SYSTEM_WUZAPI_TOKEN'"}'`

Expected: `{"received":true}` and new row in `demo_sessions`

- [ ] **Step 2: Test webhook handler — wrong template ignored**

Run: `curl -X POST https://kapster.my.id/api/webhook/whatsapp -H "Content-Type: application/json" -d '{"type":"Message","event":{"Info":{"Chat":"628123456789@s.whatsapp.net","Sender":"628123456789@s.whatsapp.net"},"Message":{"conversation":"halo"}},"token":"'$SYSTEM_WUZAPI_TOKEN'"}'`

Expected: `{"received":true}` but NO new row in `demo_sessions` (template mismatch)

- [ ] **Step 3: Test webhook handler — group message ignored**

Run: `curl -X POST https://kapster.my.id/api/webhook/whatsapp -H "Content-Type: application/json" -d '{"type":"Message","event":{"Info":{"Chat":"120363407853341919@g.us","Sender":"628123456789@s.whatsapp.net"},"Message":{"conversation":"demo"}},"token":"'$SYSTEM_WUZAPI_TOKEN'"}'`

Expected: `{"received":true}` but NO new row in `demo_sessions` (it's a group message)

- [ ] **Step 4: Test waitlist — request while session active**

Create an active session in DB, then send another "demo" request, verify waitlist entry:

```bash
# Insert fake active session
rtk psql "$DATABASE_URL" -c "INSERT INTO demo_sessions (phone, temp_password, expires_at, status) VALUES ('628999999999@s.whatsapp.net', 'Demo@test123', now() + interval '10 minutes', 'active');"

# Send demo request from different phone
curl -X POST https://kapster.my.id/api/webhook/whatsapp -H "Content-Type: application/json" -d '{"type":"Message","event":{"Info":{"Chat":"628111111111@s.whatsapp.net","Sender":"628111111111@s.whatsapp.net"},"Message":{"conversation":"demo"}},"token":"'$SYSTEM_WUZAPI_TOKEN'"}'

# Verify waitlist entry
rtk psql "$DATABASE_URL" -c "SELECT phone, status FROM demo_waitlist;"
```

Expected: waitlist has entry with `628111111111` and status `waiting`

- [ ] **Step 5: Test login via browser**

Launch browser with Playwright MCP, navigate to login page, enter demo credentials, verify dashboard loads.

```
browser navigate → https://kapster.my.id/auth/login
fill email: demo@kapster.my.id
fill password: <current_demo_password>
click submit
verify URL contains /dashboard
verify page contains "Fred"
```

- [ ] **Step 6: Test cron — session expiry + waitlist notify**

```bash
# Set session to already expired
rtk psql "$DATABASE_URL" -c "UPDATE demo_sessions SET expires_at = now() - interval '1 minute' WHERE status = 'active' LIMIT 1;"

# Trigger cron
curl -H "Authorization: Bearer $CRON_SECRET" https://kapster.my.id/api/cron/demo-cleanup

# Verify session expired
rtk psql "$DATABASE_URL" -c "SELECT status FROM demo_sessions WHERE status = 'expired';"

# Verify waitlist notified
rtk psql "$DATABASE_URL" -c "SELECT status FROM demo_waitlist WHERE status = 'notified';"
```

Expected: session status = `expired`, waitlist status = `notified`

- [ ] **Step 7: Test claim from notified**

```sql
-- Set waitlist to notified
rtk psql "$DATABASE_URL" -c "UPDATE demo_waitlist SET status = 'notified', notified_at = now() WHERE status = 'waiting' LIMIT 1;"
```

Then send "demo" from same phone — verify session created and waitlist entry removed.

- [ ] **Step 8: Run full end-to-end flow in browser**

Use Playwright MCP to:
1. Send "demo" via webhook API
2. Extract password from `demo_sessions`
3. Open browser to login page
4. Fill credentials and login
5. Verify Fred dashboard is visible
6. Expire session via DB
7. Refresh page — verify redirect to login

- [ ] **Step 9: Cleanup test data**

```bash
rtk psql "$DATABASE_URL" -c "DELETE FROM demo_sessions; DELETE FROM demo_waitlist;"
```

- [ ] **Step 10: Commit final changes**

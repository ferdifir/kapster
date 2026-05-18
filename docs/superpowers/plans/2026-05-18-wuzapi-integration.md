# WuzAPI Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate WhatsApp notifications into Kapster using WuzAPI (`wa.linkjo.my.id`) — self-service pairing per barbershop, fire-and-forget notification queue via Edge Function + pg_cron.

**Architecture:** Server actions INSERT into `wa_notifications` table → Edge Function (`wa-sender`) polls via pg_cron → sends messages via WuzAPI → updates status. Barbershop connects own WhatsApp number via QR pairing in settings.

**Tech Stack:** Supabase (PostgreSQL, Edge Functions, pg_cron, pg_net), Next.js Server Actions, WuzAPI REST API, TypeScript

---

### Task 1: Database Migration — wa_notifications table + barbershops columns

**Files:**
- Create: `supabase/migrations/add_wa_notifications.sql`

- [ ] **Step 1: Write the migration SQL**

Create `supabase/migrations/add_wa_notifications.sql`:

```sql
-- Add WhatsApp connection columns to barbershops
ALTER TABLE barbershops
ADD COLUMN IF NOT EXISTS wuzapi_user_id INT,
ADD COLUMN IF NOT EXISTS wuzapi_token TEXT,
ADD COLUMN IF NOT EXISTS wa_connected BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS wa_phone_number TEXT,
ADD COLUMN IF NOT EXISTS wa_pairing_code TEXT;

-- Create wa_notifications table
CREATE TABLE IF NOT EXISTS wa_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id UUID REFERENCES barbershops(id) ON DELETE CASCADE,
  customer_phone TEXT NOT NULL,
  customer_name TEXT,
  event_type TEXT NOT NULL,
  message_body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  wuzapi_message_id TEXT,
  error_message TEXT,
  retry_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ
);

-- Index for efficient polling of pending notifications
CREATE INDEX IF NOT EXISTS idx_wa_notifications_pending
  ON wa_notifications(status, retry_count, created_at)
  WHERE status IN ('pending', 'retrying');

-- Enable RLS
ALTER TABLE wa_notifications ENABLE ROW LEVEL SECURITY;

-- RLS: barbershop owners can view their own notifications
CREATE POLICY "Barbershop owners can view their notifications"
  ON wa_notifications FOR SELECT
  USING (barbershop_id IN (
    SELECT id FROM barbershops WHERE owner_id = auth.uid()
  ));

-- RLS: service role can manage all notifications
CREATE POLICY "Service role can manage notifications"
  ON wa_notifications FOR ALL
  USING (true) WITH CHECK (true);
```

- [ ] **Step 2: Apply the migration**

Run:
```bash
npx supabase db push
```

If Supabase CLI not configured, apply via Supabase Dashboard SQL Editor or use:
```bash
npx supabase db diff -f add_wa_notifications
```

- [ ] **Step 3: Verify migration**

Check that columns exist:
```sql
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'barbershops' AND column_name LIKE 'wa_%' OR column_name LIKE 'wuzapi_%';
```

Check table exists:
```sql
SELECT count(*) FROM information_schema.tables WHERE table_name = 'wa_notifications';
```

---

### Task 2: Environment Variables

**Files:**
- Modify: `.env`
- Modify: `.env.local`

- [ ] **Step 1: Add WuzAPI env vars to `.env`**

Append to `.env`:
```
WUZAPI_URL=https://wa.linkjo.my.id
WUZAPI_ADMIN_TOKEN=14fa7c855278a677784fa71083012060
```

- [ ] **Step 2: Add WuzAPI env vars to `.env.local`**

Append to `.env.local`:
```
WUZAPI_URL=https://wa.linkjo.my.id
WUZAPI_ADMIN_TOKEN=14fa7c855278a677784fa71083012060
```

---

### Task 3: WuzAPI Admin Client Library

**Files:**
- Create: `lib/wuzapi.ts`

- [ ] **Step 1: Create the WuzAPI client library**

Create `lib/wuzapi.ts`:

```typescript
const WUZAPI_URL = process.env.WUZAPI_URL || "https://wa.linkjo.my.id";
const WUZAPI_ADMIN_TOKEN = process.env.WUZAPI_ADMIN_TOKEN || "";

interface WuzApiResponse<T = unknown> {
  code: number;
  data: T;
  success: boolean;
}

interface WuzApiUser {
  id: number;
  name: string;
  token: string;
  webhook: string;
  jid: string;
  qrcode: string;
  connected: boolean;
  loggedIn: boolean;
  expiration: number;
  events: string;
}

interface WuzApiSessionStatus {
  id: string;
  name: string;
  connected: boolean;
  loggedIn: boolean;
  token: string;
  jid: string;
  qrcode: string;
}

function generateToken(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function createWuzApiUser(barbershopId: string): Promise<{
  userId: number;
  token: string;
} | null> {
  const token = generateToken();
  const res = await fetch(`${WUZAPI_URL}/admin/users`, {
    method: "POST",
    headers: {
      Authorization: WUZAPI_ADMIN_TOKEN,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: `kapster-${barbershopId}`,
      token,
    }),
  });

  if (!res.ok) return null;

  const data = (await res.json()) as WuzApiResponse<WuzApiUser>;
  if (!data.success) return null;

  return { userId: data.data.id, token: data.data.token };
}

export async function deleteWuzApiUser(userId: number): Promise<boolean> {
  const res = await fetch(`${WUZAPI_URL}/admin/users/${userId}`, {
    method: "DELETE",
    headers: { Authorization: WUZAPI_ADMIN_TOKEN },
  });
  return res.ok;
}

export async function connectSession(userToken: string): Promise<{
  connected: boolean;
  loggedIn: boolean;
  jid: string;
} | null> {
  const res = await fetch(`${WUZAPI_URL}/session/connect`, {
    method: "POST",
    headers: {
      Authorization: userToken,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      Subscribe: ["Message", "ReadReceipt"],
      Immediate: false,
    }),
  });

  if (!res.ok) return null;
  const data = await res.json();
  return {
    connected: true,
    loggedIn: !!data.jid,
    jid: data.jid || "",
  };
}

export async function getQrCode(userToken: string): Promise<string | null> {
  const res = await fetch(`${WUZAPI_URL}/session/qr`, {
    headers: { Authorization: userToken },
  });

  if (!res.ok) return null;
  const data = await res.json();
  return data.QRCode || null;
}

export async function getSessionStatus(userToken: string): Promise<{
  connected: boolean;
  loggedIn: boolean;
  jid: string;
} | null> {
  const res = await fetch(`${WUZAPI_URL}/session/status`, {
    headers: { Authorization: userToken },
  });

  if (!res.ok) return null;
  const data = (await res.json()) as WuzApiResponse<WuzApiSessionStatus>;
  return {
    connected: data.data.connected,
    loggedIn: data.data.loggedIn,
    jid: data.data.jid || "",
  };
}

export async function disconnectSession(userToken: string): Promise<boolean> {
  const res = await fetch(`${WUZAPI_URL}/session/disconnect`, {
    method: "POST",
    headers: { Authorization: userToken },
  });
  return res.ok;
}

export async function sendTextMessage(
  userToken: string,
  phone: string,
  body: string
): Promise<{ messageId: string; success: boolean; error?: string }> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const res = await fetch(`${WUZAPI_URL}/chat/send/text`, {
      method: "POST",
      headers: {
        Authorization: userToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ Phone: phone, Body: body }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      const text = await res.text();
      return {
        messageId: "",
        success: false,
        error: `WuzAPI error ${res.status}: ${text}`,
      };
    }

    const data = (await res.json()) as WuzApiResponse<{ Id: string }>;
    return {
      messageId: data.data?.Id || "",
      success: true,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { messageId: "", success: false, error: message };
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run:
```bash
npx tsc --noEmit
```

Expected: No errors related to `lib/wuzapi.ts`.

---

### Task 4: WhatsApp Notification Template Renderer

**Files:**
- Create: `lib/wa-templates.ts`

- [ ] **Step 1: Create the template renderer**

Create `lib/wa-templates.ts`:

```typescript
export type WAEventType =
  | "join_queue"
  | "queue_called"
  | "queue_serving"
  | "queue_done"
  | "queue_number_update"
  | "booking_confirmed"
  | "booking_reminder";

export interface WAEventContext {
  name: string;
  barbershop: string;
  number?: string | number;
  date?: string;
  time?: string;
  estimated?: string;
  position?: number;
  service?: string;
  barber?: string;
}

const templates: Record<WAEventType, string> = {
  join_queue:
    "Halo {name}! Anda telah terdaftar di antrian *{barbershop}*. Nomor antrian: *#{number}*. Tanggal: {date}. Tunggu konfirmasi dari kami ya!",
  queue_called:
    "Halo {name}, giliran Anda hampir tiba! Nomor antrian *#{number}* di *{barbershop}*. Mohon bersiap ya!",
  queue_serving:
    "Halo {name}, Anda sekarang sedang dilayani di *{barbershop}* (#{number}). Terima kasih atas kesabarannya!",
  queue_done:
    "Halo {name}, layanan Anda di *{barbershop}* telah selesai (#{number}). Terima kasih sudah berkunjung!",
  queue_number_update:
    "Halo {name}, update antrian Anda di *{barbershop}*. Nomor: *#{number}*. Estimasi: {estimated}. Posisi Anda saat ini: {position} orang sebelum Anda.",
  booking_confirmed:
    "Halo {name}, booking Anda di *{barbershop}* telah dikonfirmasi! 📅 {date}, ⏰ {time}. Layanan: {service}. Barber: {barber}. Sampai jumpa!",
  booking_reminder:
    "Halo {name}, reminder: booking Anda di *{barbershop}* dalam 1 jam lagi. 📅 {date}, ⏰ {time}. Jangan sampai telat ya!",
};

export function renderWATemplate(
  eventType: WAEventType,
  context: WAEventContext
): string {
  const template = templates[eventType];
  if (!template) return "";

  return template
    .replace("{name}", context.name || "Pelanggan")
    .replace("{barbershop}", context.barbershop || "")
    .replace("{number}", String(context.number ?? ""))
    .replace("{date}", context.date ?? "")
    .replace("{time}", context.time ?? "")
    .replace("{estimated}", context.estimated ?? "")
    .replace("{position}", String(context.position ?? ""))
    .replace("{service}", context.service ?? "")
    .replace("{barber}", context.barber ?? "");
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run:
```bash
npx tsc --noEmit
```

---

### Task 5: Queue WA Notification Helper

**Files:**
- Create: `lib/wa-queue.ts`

- [ ] **Step 1: Create the queue notification helper**

Create `lib/wa-queue.ts`:

```typescript
import { createAdminClient } from "@/lib/supabase/admin";
import { renderWATemplate, type WAEventType } from "@/lib/wa-templates";

export async function enqueueWANotification(
  barbershopId: string,
  customerPhone: string,
  customerName: string,
  eventType: WAEventType,
  context: {
    number?: string | number;
    date?: string;
    time?: string;
    estimated?: string;
    position?: number;
    service?: string;
    barber?: string;
  }
) {
  try {
    const supabase = createAdminClient();

    // Fetch barbershop name
    const { data: barbershop } = await supabase
      .from("barbershops")
      .select("name")
      .eq("id", barbershopId)
      .single();

    if (!barbershop) return;

    const messageBody = renderWATemplate(eventType, {
      name: customerName,
      barbershop: barbershop.name,
      ...context,
    });

    await supabase.from("wa_notifications").insert({
      barbershop_id: barbershopId,
      customer_phone: customerPhone,
      customer_name: customerName,
      event_type: eventType,
      message_body: messageBody,
      status: "pending",
    });
  } catch {
    // Silently fail — WA notification must never block the main process
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run:
```bash
npx tsc --noEmit
```

---

### Task 6: Wire WA Notifications into Queue Actions

**Files:**
- Modify: `app/q/[slug]/actions.ts`
- Modify: `app/dashboard/queue/actions.ts`

- [ ] **Step 1: Add WA notification to joinQueue**

Modify `app/q/[slug]/actions.ts` — add import at top:

```typescript
import { enqueueWANotification } from "@/lib/wa-queue";
```

After the successful INSERT (line 122, after `if (error) return { error: error.message };`), add:

```typescript
  if (error) return { error: error.message };

  // Fire-and-forget WA notification
  if (formData.phone) {
    await enqueueWANotification(
      barbershopId,
      formData.phone.trim(),
      customerName,
      "join_queue",
      { number: nextNum, date }
    );
  }

  return { data };
```

- [ ] **Step 2: Add WA notification to setEntryStatus**

Modify `app/dashboard/queue/actions.ts` — add import at top:

```typescript
import { enqueueWANotification } from "@/lib/wa-queue";
```

Replace the entire `setEntryStatus` function with:

```typescript
export async function setEntryStatus(
  entryId: string,
  status: "called" | "serving" | "done" | "skip",
  queueId?: string
) {
  const supabase = await createClient();

  // Fetch entry data before updating
  const { data: entry } = await supabase
    .from("queue_entries")
    .select("phone, customer_name, number, queue_id, barbershop_id")
    .eq("id", entryId)
    .single();

  const now = new Date().toISOString();
  const updates: TablesUpdate<"queue_entries"> = { status };
  if (status === "called") updates.called_at = now;
  if (status === "serving") updates.serving_at = now;
  if (status === "done" || status === "skip") updates.done_at = now;

  const { error } = await supabase
    .from("queue_entries")
    .update(updates)
    .eq("id", entryId);

  if (error) return { error: error.message };

  if (status === "done" && queueId) {
    await supabase.rpc("increment_queue_served", { p_queue_id: queueId });
  }

  // Fire-and-forget WA notification
  if (entry?.phone && entry.phone.trim()) {
    const eventTypeMap: Record<string, "queue_called" | "queue_serving" | "queue_done"> = {
      called: "queue_called",
      serving: "queue_serving",
      done: "queue_done",
    };
    const eventType = eventTypeMap[status];
    if (eventType) {
      await enqueueWANotification(
        barbershopIdFromQueue(queueId || entry.queue_id),
        entry.phone,
        entry.customer_name,
        eventType,
        { number: entry.number }
      );
    }
  }

  revalidatePath("/dashboard/queue");
  return {};
}

async function barbershopIdFromQueue(queueId: string): Promise<string> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("queues")
    .select("barbershop_id")
    .eq("id", queueId)
    .single();
  return data?.barbershop_id || "";
}
```

- [ ] **Step 3: Verify TypeScript compiles**

Run:
```bash
npx tsc --noEmit
```

---

### Task 7: Wire WA Notifications into Booking Actions

**Files:**
- Modify: `app/booking/[slug]/actions.ts`

- [ ] **Step 1: Add WA notification to createBooking**

Replace the entire `app/booking/[slug]/actions.ts` with:

```typescript
"use server";

import { createClient } from "@/lib/supabase/server";
import { enqueueWANotification } from "@/lib/wa-queue";

export async function createBooking(
  barbershopId: string,
  form: {
    customer_name: string;
    phone: string;
    barber_id?: string;
    service_id?: string;
    scheduled_at: string;
    notes?: string;
  }
) {
  const supabase = await createClient();

  // Fetch barbershop name, barber name, service name for template
  const [{ data: barbershop }, { data: service }, { data: barber }] =
    await Promise.all([
      supabase.from("barbershops").select("name").eq("id", barbershopId).single(),
      form.service_id
        ? supabase.from("services").select("name").eq("id", form.service_id).single()
        : Promise.resolve({ data: null }),
      form.barber_id
        ? supabase.from("barbers").select("display_name").eq("id", form.barber_id).single()
        : Promise.resolve({ data: null }),
    ]);

  const { data, error } = await supabase
    .from("bookings")
    .insert({
      barbershop_id: barbershopId,
      customer_name: form.customer_name.trim(),
      phone: form.phone.trim(),
      barber_id: form.barber_id || null,
      service_id: form.service_id || null,
      scheduled_at: form.scheduled_at,
      notes: form.notes?.trim() || null,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  // Fire-and-forget WA notification
  const scheduledDate = new Date(form.scheduled_at);
  await enqueueWANotification(
    barbershopId,
    form.phone.trim(),
    form.customer_name.trim(),
    "booking_confirmed",
    {
      date: scheduledDate.toLocaleDateString("id-ID", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      time: scheduledDate.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      service: service?.name || "",
      barber: barber?.display_name || "",
    }
  );

  return { data };
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run:
```bash
npx tsc --noEmit
```

---

### Task 8: WhatsApp Connection Server Actions

**Files:**
- Create: `app/dashboard/settings/wa-connect/actions.ts`

- [ ] **Step 1: Create WA connection server actions**

Create `app/dashboard/settings/wa-connect/actions.ts`:

```typescript
"use server";

import { createClient } from "@/lib/supabase/server";
import {
  createWuzApiUser,
  deleteWuzApiUser,
  connectSession,
  getQrCode,
  getSessionStatus,
  disconnectSession,
} from "@/lib/wuzapi";
import { revalidatePath } from "next/cache";

export async function connectWhatsApp(barbershopId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: barbershop } = await supabase
    .from("barbershops")
    .select("wuzapi_user_id, wuzapi_token, wa_connected")
    .eq("id", barbershopId)
    .eq("owner_id", user.id)
    .single();

  if (!barbershop) return { error: "Barbershop not found" };

  // If already has credentials, just try to connect
  if (barbershop.wuzapi_user_id && barbershop.wuzapi_token) {
    const result = await connectSession(barbershop.wuzapi_token);
    if (!result) return { error: "Gagal connect ke WhatsApp" };

    const { error: updateError } = await supabase
      .from("barbershops")
      .update({ wa_connected: false })
      .eq("id", barbershopId);

    if (updateError) return { error: updateError.message };
    revalidatePath("/dashboard/settings");
    return { success: true, needsQr: !result.loggedIn };
  }

  // Create new WuzAPI user
  const newUser = await createWuzApiUser(barbershopId);
  if (!newUser) return { error: "Gagal membuat akun WhatsApp" };

  const { error: updateError } = await supabase
    .from("barbershops")
    .update({
      wuzapi_user_id: newUser.userId,
      wuzapi_token: newUser.token,
      wa_connected: false,
    })
    .eq("id", barbershopId);

  if (updateError) {
    await deleteWuzApiUser(newUser.userId);
    return { error: updateError.message };
  }

  // Connect session
  const result = await connectSession(newUser.token);
  if (!result) return { error: "Gagal connect session" };

  revalidatePath("/dashboard/settings");
  return { success: true, needsQr: !result.loggedIn };
}

export async function getWhatsAppQr(barbershopId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: barbershop } = await supabase
    .from("barbershops")
    .select("wuzapi_token")
    .eq("id", barbershopId)
    .eq("owner_id", user.id)
    .single();

  if (!barbershop?.wuzapi_token) return { error: "WhatsApp not configured" };

  const qr = await getQrCode(barbershop.wuzapi_token);
  if (!qr) return { error: "Gagal mengambil QR code" };

  return { qr };
}

export async function checkWhatsAppStatus(barbershopId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: barbershop } = await supabase
    .from("barbershops")
    .select("wuzapi_token, wa_connected")
    .eq("id", barbershopId)
    .eq("owner_id", user.id)
    .single();

  if (!barbershop?.wuzapi_token) return { error: "WhatsApp not configured" };

  const status = await getSessionStatus(barbershop.wuzapi_token);
  if (!status) return { error: "Gagal cek status" };

  // Update DB if newly connected
  if (status.loggedIn && !barbershop.wa_connected) {
    const phoneNumber = status.jid.replace("@s.whatsapp.net", "");
    await supabase
      .from("barbershops")
      .update({ wa_connected: true, wa_phone_number: phoneNumber })
      .eq("id", barbershopId);
  }

  revalidatePath("/dashboard/settings");
  return { connected: status.connected, loggedIn: status.loggedIn, jid: status.jid };
}

export async function disconnectWhatsApp(barbershopId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: barbershop } = await supabase
    .from("barbershops")
    .select("wuzapi_token, wuzapi_user_id")
    .eq("id", barbershopId)
    .eq("owner_id", user.id)
    .single();

  if (!barbershop?.wuzapi_token) return { error: "WhatsApp not configured" };

  await disconnectSession(barbershop.wuzapi_token);

  await supabase
    .from("barbershops")
    .update({ wa_connected: false, wa_phone_number: null })
    .eq("id", barbershopId);

  revalidatePath("/dashboard/settings");
  return { success: true };
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run:
```bash
npx tsc --noEmit
```

---

### Task 9: WhatsApp Settings UI — Connection Section

**Files:**
- Modify: `components/dashboard/SettingsForm.tsx`
- Modify: `app/dashboard/settings/page.tsx`

- [ ] **Step 1: Update settings page to pass WA data**

Modify `app/dashboard/settings/page.tsx` — update the select query to include WA columns:

```typescript
  const { data: barbershop } = await supabase
    .from("barbershops")
    .select("id, name, slug, address, city, phone, wa_number, latitude, longitude, settings_json, logo_url, wuzapi_user_id, wuzapi_token, wa_connected, wa_phone_number")
    .eq("owner_id", user.id)
    .single();
```

- [ ] **Step 2: Update SettingsForm type and add WhatsApp section**

Modify `components/dashboard/SettingsForm.tsx` — update the `Barbershop` type:

```typescript
type Barbershop = {
  id: string;
  name: string;
  slug: string;
  address: string | null;
  city: string | null;
  phone: string | null;
  wa_number: string | null;
  latitude: number | null;
  longitude: number | null;
  settings_json: Json;
  logo_url: string | null;
  wuzapi_user_id: number | null;
  wuzapi_token: string | null;
  wa_connected: boolean;
  wa_phone_number: string | null;
};
```

Add imports at top:
```typescript
import { useState, useEffect, useRef } from "react";
import {
  connectWhatsApp,
  getWhatsAppQr,
  checkWhatsAppStatus,
  disconnectWhatsApp,
} from "@/app/dashboard/settings/wa-connect/actions";
```

Add state variables inside the component (after existing state declarations):
```typescript
  const [waDisclaimerAccepted, setWaDisclaimerAccepted] = useState(false);
  const [waConnecting, setWaConnecting] = useState(false);
  const [waQrCode, setWaQrCode] = useState<string | null>(null);
  const [waStatus, setWaStatus] = useState<{
    connected: boolean;
    loggedIn: boolean;
  } | null>(null);
  const [waError, setWaError] = useState("");
  const [waSuccess, setWaSuccess] = useState("");
  const qrPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
```

Add QR polling effect:
```typescript
  // Poll for WA status when waiting for QR scan
  useEffect(() => {
    if (waQrCode) {
      qrPollRef.current = setInterval(async () => {
        const result = await checkWhatsAppStatus(barbershop.id);
        if (result.loggedIn) {
          setWaQrCode(null);
          setWaStatus({ connected: true, loggedIn: true });
          setWaSuccess("WhatsApp berhasil terhubung!");
          if (qrPollRef.current) clearInterval(qrPollRef.current);
        }
      }, 3000);
    }
    return () => {
      if (qrPollRef.current) clearInterval(qrPollRef.current);
    };
  }, [waQrCode, barbershop.id]);
```

Add handler functions before `return`:
```typescript
  const handleWaConnect = async () => {
    setWaError("");
    setWaSuccess("");
    setWaConnecting(true);
    const result = await connectWhatsApp(barbershop.id);
    setWaConnecting(false);
    if (result.error) {
      setWaError(result.error);
      return;
    }
    if (result.needsQr) {
      const qrResult = await getWhatsAppQr(barbershop.id);
      if (qrResult.error) {
        setWaError(qrResult.error);
      } else {
        setWaQrCode(qrResult.qr);
      }
    } else {
      setWaSuccess("WhatsApp berhasil terhubung!");
      const statusResult = await checkWhatsAppStatus(barbershop.id);
      if (!statusResult.error) {
        setWaStatus({ connected: statusResult.connected, loggedIn: statusResult.loggedIn });
      }
    }
  };

  const handleWaDisconnect = async () => {
    setWaError("");
    setWaSuccess("");
    const result = await disconnectWhatsApp(barbershop.id);
    if (result.error) {
      setWaError(result.error);
    } else {
      setWaStatus(null);
      setWaQrCode(null);
      setWaSuccess("WhatsApp berhasil disconnect.");
    }
  };
```

Add the WhatsApp section JSX — insert it after the "Pengaturan Antrian" section and before the submit button. Find the closing `</form>` tag and insert before it:

```tsx
      {/* WhatsApp Connection Section */}
      <div className="bg-dark-800/50 border border-dark-700/30 rounded-2xl p-6 space-y-4">
        <h2 className="font-semibold text-white">WhatsApp Notification</h2>

        {waError && (
          <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {waError}
          </div>
        )}
        {waSuccess && (
          <div className="px-4 py-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
            {waSuccess}
          </div>
        )}

        {/* Connection Status */}
        {barbershop.wa_connected ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400" />
              <span className="text-green-400 text-sm font-medium">
                Terhubung: {barbershop.wa_phone_number}
              </span>
            </div>
            <button
              type="button"
              onClick={handleWaDisconnect}
              className="px-5 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 font-bold text-sm hover:bg-red-500/20"
            >
              Disconnect WhatsApp
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Disclaimer */}
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <p className="text-amber-300 text-sm font-medium mb-2">⚠️ Peringatan</p>
              <p className="text-amber-300/80 text-xs leading-relaxed">
                Fitur ini menggunakan WhatsApp API tidak resmi (unofficial). Resiko pemblokiran
                nomor WhatsApp ditanggung oleh pemilik barbershop. Kami tidak bertanggung jawab
                atas nomor yang diblokir oleh WhatsApp. Gunakan dengan bijak dan hindari
                pengiriman pesan spam.
              </p>
              <label className="flex items-center gap-2 mt-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={waDisclaimerAccepted}
                  onChange={(e) => setWaDisclaimerAccepted(e.target.checked)}
                  className="rounded border-dark-600 bg-dark-700 text-barber-400"
                />
                <span className="text-amber-300/80 text-xs">
                  Saya memahami resiko dan ingin melanjutkan
                </span>
              </label>
            </div>

            {/* QR Code Display */}
            {waQrCode && (
              <div className="space-y-3 text-center">
                <p className="text-dark-400 text-sm">
                  Scan QR code ini dengan WhatsApp di HP Anda:
                </p>
                <div className="inline-block p-4 bg-white rounded-xl">
                  <img src={waQrCode} alt="WhatsApp QR Code" className="w-64 h-64" />
                </div>
                <p className="text-dark-500 text-xs">
                  Menunggu scan... (akan otomatis terdeteksi)
                </p>
              </div>
            )}

            {/* Connect Button */}
            {!waQrCode && (
              <button
                type="button"
                onClick={handleWaConnect}
                disabled={waConnecting || !waDisclaimerAccepted}
                className="px-5 py-2.5 rounded-xl gold-gradient text-dark-900 font-bold text-sm disabled:opacity-50"
              >
                {waConnecting ? "Menghubungkan..." : "Connect WhatsApp"}
              </button>
            )}
          </div>
        )}
      </div>
```

- [ ] **Step 3: Verify TypeScript compiles**

Run:
```bash
npx tsc --noEmit
```

---

### Task 10: Edge Function — wa-sender

**Files:**
- Create: `supabase/functions/wa-sender/index.ts`
- Create: `supabase/functions/wa-sender/deno.json`

- [ ] **Step 1: Create the Edge Function**

Create `supabase/functions/wa-sender/deno.json`:

```json
{
  "imports": {}
}
```

Create `supabase/functions/wa-sender/index.ts`:

```typescript
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.105.4";

const WUZAPI_URL = Deno.env.get("WUZAPI_URL") || "https://wa.linkjo.my.id";

interface Notification {
  id: string;
  barbershop_id: string;
  customer_phone: string;
  customer_name: string;
  event_type: string;
  message_body: string;
  status: string;
  wuzapi_message_id: string | null;
  retry_count: number;
  created_at: string;
}

const RETRY_DELAYS: Record<number, number> = {
  1: 30,    // 30 seconds
  2: 120,   // 2 minutes
  3: 300,   // 5 minutes
};

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Fetch pending notifications with retry delay check
  const { data: notifications, error: fetchError } = await supabase
    .from("wa_notifications")
    .select("*")
    .in("status", ["pending", "retrying"])
    .lt("retry_count", 3)
    .is("wuzapi_message_id", null)
    .order("created_at", { ascending: true })
    .limit(10);

  if (fetchError || !notifications || notifications.length === 0) {
    return new Response(JSON.stringify({ processed: 0, sent: 0, failed: 0 }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  // Filter by retry delay
  const now = new Date();
  const eligible = notifications.filter((n: Notification) => {
    if (n.retry_count === 0) return true;
    const delay = RETRY_DELAYS[n.retry_count] || 300;
    const createdAt = new Date(n.created_at);
    const nextAttempt = new Date(createdAt.getTime() + delay * 1000);
    return now >= nextAttempt;
  });

  let sent = 0;
  let failed = 0;

  for (const notification of eligible) {
    // Fetch barbershop token
    const { data: barbershop } = await supabase
      .from("barbershops")
      .select("wuzapi_token, wa_connected")
      .eq("id", notification.barbershop_id)
      .single();

    if (!barbershop?.wuzapi_token) {
      await supabase
        .from("wa_notifications")
        .update({
          status: "failed",
          error_message: "WA not connected — no token",
        })
        .eq("id", notification.id);
      failed++;
      continue;
    }

    if (!barbershop.wa_connected) {
      await supabase
        .from("wa_notifications")
        .update({
          status: "failed",
          error_message: "WA disconnected",
        })
        .eq("id", notification.id);
      failed++;
      continue;
    }

    // Send message via WuzAPI
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

      const res = await fetch(`${WUZAPI_URL}/chat/send/text`, {
        method: "POST",
        headers: {
          Authorization: barbershop.wuzapi_token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          Phone: notification.customer_phone,
          Body: notification.message_body,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (res.ok) {
        const data = await res.json();
        await supabase
          .from("wa_notifications")
          .update({
            status: "sent",
            wuzapi_message_id: data.data?.Id || "",
            sent_at: new Date().toISOString(),
          })
          .eq("id", notification.id);
        sent++;
      } else {
        const status = res.status;
        const text = await res.text();

        if (status === 400) {
          // Invalid phone number — don't retry
          await supabase
            .from("wa_notifications")
            .update({
              status: "failed",
              error_message: `Invalid phone: ${text}`,
            })
            .eq("id", notification.id);
          failed++;
        } else {
          // Retry
          const newRetryCount = notification.retry_count + 1;
          await supabase
            .from("wa_notifications")
            .update({
              status: "retrying",
              retry_count: newRetryCount,
              error_message: `WuzAPI ${status}: ${text}`,
            })
            .eq("id", notification.id);
          failed++;
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      const newRetryCount = notification.retry_count + 1;
      await supabase
        .from("wa_notifications")
        .update({
          status: newRetryCount >= 3 ? "failed" : "retrying",
          retry_count: newRetryCount,
          error_message: message,
        })
        .eq("id", notification.id);
      failed++;
    }
  }

  return new Response(
    JSON.stringify({
      processed: eligible.length,
      sent,
      failed,
    }),
    { headers: { "Content-Type": "application/json" } }
  );
});
```

- [ ] **Step 2: Deploy the Edge Function**

Run:
```bash
npx supabase functions deploy wa-sender --no-verify-jwt
```

Set environment variables for the function:
```bash
npx supabase secrets set WUZAPI_URL=https://wa.linkjo.my.id
```

- [ ] **Step 3: Test the Edge Function locally (optional)**

Run:
```bash
npx supabase functions serve wa-sender --env-file .env
```

Then test:
```bash
curl -X POST http://localhost:54321/functions/v1/wa-sender
```

Expected: `{"processed":0,"sent":0,"failed":0}` (empty queue).

---

### Task 11: pg_cron Jobs — Send + Reminder

**Files:**
- Create: `supabase/migrations/add_wa_cron_jobs.sql`

- [ ] **Step 1: Create the cron jobs migration**

Create `supabase/migrations/add_wa_cron_jobs.sql`:

```sql
-- Enable pg_net extension for HTTP calls from SQL
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Job 1: Process pending WA notifications every minute
SELECT cron.schedule(
  'wa-send-job',
  '* * * * *',
  $$
    SELECT net.http_post(
      url := current_setting('app.settings.supabase_url') || '/functions/v1/wa-sender',
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || current_setting('app.settings.supabase_service_role_key')
      ),
      body := '{}'
    );
  $$
);

-- Job 2: Booking reminders — every 5 minutes, find bookings 1 hour away
SELECT cron.schedule(
  'wa-reminder-job',
  '*/5 * * * *',
  $$
    INSERT INTO wa_notifications (barbershop_id, customer_phone, customer_name, event_type, message_body)
    SELECT
      b.id,
      bk.phone,
      bk.customer_name,
      'booking_reminder',
      'Halo ' || bk.customer_name || ', reminder: booking Anda di *' || b.name || '* dalam 1 jam lagi. 📅 ' ||
      to_char(bk.scheduled_at, 'Day, DD Month YYYY') || ', ⏰ ' || to_char(bk.scheduled_at, 'HH24:MI') || '. Jangan sampai telat ya!'
    FROM bookings bk
    JOIN barbershops b ON b.id = bk.barbershop_id
    WHERE bk.status = 'confirmed'
      AND bk.scheduled_at BETWEEN NOW() + INTERVAL '59 minutes' AND NOW() + INTERVAL '61 minutes'
      AND NOT EXISTS (
        SELECT 1 FROM wa_notifications wn
        WHERE wn.barbershop_id = b.id
          AND wn.customer_phone = bk.phone
          AND wn.event_type = 'booking_reminder'
          AND wn.created_at > NOW() - INTERVAL '2 hours'
      );
  $$
);
```

- [ ] **Step 2: Apply the migration**

Run:
```bash
npx supabase db push
```

- [ ] **Step 3: Set required Postgres settings**

The cron job uses `current_setting('app.settings.supabase_url')` and `current_setting('app.settings.supabase_service_role_key')`. Set these in Supabase Dashboard → Database → Settings → Custom GUC, or run:

```sql
ALTER DATABASE postgres SET app.settings.supabase_url TO 'https://arlpgnxtdbtvuxqvcytg.supabase.co';
ALTER DATABASE postgres SET app.settings.supabase_service_role_key TO '<your_service_role_key>';
```

---

### Task 12: Update Supabase Types

**Files:**
- Modify: `lib/supabase/types.ts`

- [ ] **Step 1: Regenerate types from Supabase**

Run:
```bash
npx supabase gen types typescript --project-id arlpgnxtdbtvuxqvcytg > lib/supabase/types.ts
```

If CLI not available, manually add the `wa_notifications` type to `lib/supabase/types.ts`:

In the `Tables` section, add after `subscriptions`:

```typescript
      wa_notifications: {
        Row: {
          id: string
          barbershop_id: string
          customer_phone: string
          customer_name: string | null
          event_type: string
          message_body: string
          status: string
          wuzapi_message_id: string | null
          error_message: string | null
          retry_count: number
          created_at: string
          sent_at: string | null
        }
        Insert: {
          id?: string
          barbershop_id: string
          customer_phone: string
          customer_name?: string | null
          event_type: string
          message_body: string
          status?: string
          wuzapi_message_id?: string | null
          error_message?: string | null
          retry_count?: number
          created_at?: string
          sent_at?: string | null
        }
        Update: {
          id?: string
          barbershop_id?: string
          customer_phone?: string
          customer_name?: string | null
          event_type?: string
          message_body?: string
          status?: string
          wuzapi_message_id?: string | null
          error_message?: string | null
          retry_count?: number
          created_at?: string
          sent_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wa_notifications_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: false
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
        ]
      }
```

And update `barbershops` Row/Insert/Update to include:
```typescript
          wuzapi_user_id: number | null
          wuzapi_token: string | null
          wa_connected: boolean
          wa_phone_number: string | null
          wa_pairing_code: string | null
```

- [ ] **Step 2: Verify TypeScript compiles**

Run:
```bash
npx tsc --noEmit
```

---

### Task 13: Commit

- [ ] **Step 1: Commit all changes**

```bash
git add .
git commit -m "feat: integrate WuzAPI WhatsApp notifications

- Add wa_notifications table and barbershops WA columns
- Add WuzAPI admin client library (lib/wuzapi.ts)
- Add notification template renderer (lib/wa-templates.ts)
- Add queue notification helper (lib/wa-queue.ts)
- Wire WA notifications into queue and booking actions
- Add WhatsApp connection UI in settings with disclaimer
- Deploy wa-sender Edge Function
- Add pg_cron jobs for sending and booking reminders"
```

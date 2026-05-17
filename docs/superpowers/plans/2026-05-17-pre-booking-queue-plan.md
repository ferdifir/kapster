# Pre-Booking Antrian Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow customers to join queues for future dates even when the queue is not yet opened, with owner-configurable booking window.

**Architecture:** Add date picker to public queue page, modify server action to accept date parameter and auto-create queue rows, update status page to show future queue info, add date navigation to dashboard, and add booking_max_days setting.

**Tech Stack:** Next.js (App Router), React, TypeScript, Supabase/PostgreSQL

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `app/q/[slug]/page.tsx` | Modify | Add date picker, remove isOpen conditional, query queue by selected date |
| `app/q/[slug]/actions.ts` | Modify | Accept date param, validate dates, auto-create queue, add is_open validation |
| `app/q/[slug]/JoinQueueForm.tsx` | Modify | Add date picker input, pass date to joinQueue action |
| `app/q/[slug]/status/[id]/page.tsx` | Modify | Query queue date/is_open, show future queue status messages |
| `app/dashboard/queue/page.tsx` | Modify | Add date picker for navigation, query queue by selected date |
| `components/dashboard/QueueDashboard.tsx` | Modify | Accept selectedDate prop, show pre-booking badge, handle future dates |
| `app/dashboard/settings/page.tsx` | Modify | Pass settings_json to SettingsForm |
| `app/dashboard/settings/actions.ts` | Modify | Add updateBookingMaxDays action |
| `components/dashboard/SettingsForm.tsx` | Modify | Add booking_max_days field |

---

### Task 1: Add booking_max_days setting to dashboard

**Files:**
- Modify: `app/dashboard/settings/page.tsx`
- Modify: `app/dashboard/settings/actions.ts`
- Modify: `components/dashboard/SettingsForm.tsx`

- [ ] **Step 1: Add updateBookingMaxDays server action**

Add to `app/dashboard/settings/actions.ts`:

```typescript
export async function updateBookingMaxDays(
  barbershopId: string,
  bookingMaxDays: number
) {
  const supabase = await createClient();

  // Fetch current settings_json
  const { data: current } = await supabase
    .from("barbershops")
    .select("settings_json")
    .eq("id", barbershopId)
    .single();

  const settings = (current?.settings_json as Record<string, unknown>) ?? {};
  settings.booking_max_days = bookingMaxDays;

  const { error } = await supabase
    .from("barbershops")
    .update({ settings_json: settings })
    .eq("id", barbershopId);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/settings");
  revalidatePath("/q");
  return {};
}
```

- [ ] **Step 2: Update settings page to pass settings_json**

Modify `app/dashboard/settings/page.tsx` — change the barbershop query to also select `settings_json`:

```typescript
// Change line 14-18 from:
const { data: barbershop } = await supabase
  .from("barbershops")
  .select("id, name, slug, address, city, phone, wa_number, latitude, longitude")
  .eq("owner_id", user.id)
  .single();

// To:
const { data: barbershop } = await supabase
  .from("barbershops")
  .select("id, name, slug, address, city, phone, wa_number, latitude, longitude, settings_json")
  .eq("owner_id", user.id)
  .single();
```

- [ ] **Step 3: Add booking_max_days field to SettingsForm**

Modify `components/dashboard/SettingsForm.tsx`:

Update the Barbershop type to include settings_json:
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
  settings_json: Record<string, unknown> | null;
};
```

Add state for bookingMaxDays:
```typescript
const [bookingMaxDays, setBookingMaxDays] = useState(
  (barbershop.settings_json as any)?.booking_max_days ?? 7
);
const [bookingDaysPending, setBookingDaysPending] = useState(false);
const [bookingDaysSuccess, setBookingDaysSuccess] = useState(false);
```

Add handler:
```typescript
const handleBookingMaxDaysSave = () => {
  const val = parseInt(bookingMaxDays, 10);
  if (isNaN(val) || val < 1 || val > 365) return;
  setBookingDaysSuccess(false);
  setBookingDaysPending(true);
  updateBookingMaxDays(barbershop.id, val).then((result) => {
    setBookingDaysPending(false);
    if (result.error) {
      setError(result.error);
    } else {
      setBookingDaysSuccess(true);
      setTimeout(() => setBookingDaysSuccess(false), 3000);
    }
  });
};
```

Add the UI section before the submit button (before the closing `</form>` tag, after the MapPicker section):

```tsx
<div className="bg-dark-800/50 border border-dark-700/30 rounded-2xl p-6 space-y-4">
  <h2 className="font-semibold text-white">Pengaturan Antrian</h2>
  <div className="space-y-3">
    <div>
      <label className="text-dark-400 text-xs mb-1 block">
        Batas Hari Booking ke Depan
      </label>
      <input
        type="number"
        min={1}
        max={365}
        value={bookingMaxDays}
        onChange={(e) => {
          setBookingMaxDays(e.target.value);
          setBookingDaysSuccess(false);
        }}
        className="w-full px-4 py-3 rounded-xl bg-dark-700/50 border border-dark-600/50 text-white placeholder-dark-500 text-sm focus:outline-none focus:border-barber-400/50"
      />
      <p className="text-dark-600 text-xs mt-1">
        Customer bisa booking antrian hingga {bookingMaxDays} hari ke depan. Default: 7 hari.
      </p>
    </div>
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={handleBookingMaxDaysSave}
        disabled={bookingDaysPending}
        className="px-5 py-2.5 rounded-xl gold-gradient text-dark-900 font-bold text-sm disabled:opacity-50"
      >
        {bookingDaysPending ? "Menyimpan..." : "Simpan"}
      </button>
      {bookingDaysSuccess && (
        <span className="text-green-400 text-sm">Berhasil disimpan</span>
      )}
    </div>
  </div>
</div>
```

- [ ] **Step 4: Verify TypeScript compiles**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: No errors related to the changed files.

- [ ] **Step 5: Commit**

```bash
git add app/dashboard/settings/page.tsx app/dashboard/settings/actions.ts components/dashboard/SettingsForm.tsx
git commit -m "feat: add booking_max_days setting to dashboard"
```

---

### Task 2: Modify joinQueue server action to accept date parameter

**Files:**
- Modify: `app/q/[slug]/actions.ts`

- [ ] **Step 1: Rewrite joinQueue to accept date, add validation, auto-create queue**

Replace the entire contents of `app/q/[slug]/actions.ts` with:

```typescript
"use server";

import { createClient } from "@/lib/supabase/server";

const DEFAULT_MAX_DAYS = 7;

export async function joinQueue(
  barbershopId: string,
  date: string,
  formData: {
    customer_name: string;
    phone?: string;
    service_id?: string;
    barber_id?: string;
  }
) {
  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0];

  // Validate: date cannot be in the past
  if (date < today) {
    return { error: "Tidak bisa mendaftar untuk tanggal yang sudah lewat." };
  }

  // Validate: date cannot exceed booking window
  const maxDaysDate = new Date();
  maxDaysDate.setDate(maxDaysDate.getDate() + DEFAULT_MAX_DAYS);
  const maxDaysStr = maxDaysDate.toISOString().split("T")[0];

  if (date > maxDaysStr) {
    return { error: `Maksimal booking ${DEFAULT_MAX_DAYS} hari ke depan.` };
  }

  // Fetch or auto-create queue row for the selected date
  const { data: existingQueue } = await supabase
    .from("queues")
    .select("id, is_open")
    .eq("barbershop_id", barbershopId)
    .eq("date", date)
    .maybeSingle();

  let queueId: string;
  let isOpen: boolean;

  if (existingQueue) {
    queueId = existingQueue.id;
    isOpen = existingQueue.is_open;
  } else {
    // Auto-create queue with is_open: false
    const { data: newQueue, error: queueError } = await supabase
      .from("queues")
      .upsert(
        { barbershop_id: barbershopId, date, is_open: false },
        { onConflict: "barbershop_id,date" }
      )
      .select("id, is_open")
      .single();

    if (queueError) return { error: queueError.message };
    queueId = newQueue.id;
    isOpen = newQueue.is_open;
  }

  // Check is_open + date logic
  if (!isOpen && date === today) {
    return { error: "Antrian belum dibuka." };
  }

  // Enforce daily queue limit from subscription
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("max_queue_per_day")
    .eq("barbershop_id", barbershopId)
    .single();

  if (sub) {
    const { count } = await supabase
      .from("queue_entries")
      .select("id", { count: "exact", head: true })
      .eq("queue_id", queueId);

    if (count !== null && count >= sub.max_queue_per_day) {
      return { error: "Antrian hari ini sudah penuh. Coba lagi besok." };
    }
  }

  const { data: nextNum, error: numError } = await supabase.rpc(
    "next_queue_number",
    { p_queue_id: queueId }
  );

  if (numError) return { error: numError.message };

  const { data, error } = await supabase
    .from("queue_entries")
    .insert({
      queue_id: queueId,
      number: nextNum,
      customer_name: formData.customer_name.trim(),
      phone: formData.phone?.trim() || null,
      service_id: formData.service_id || null,
      barber_id: formData.barber_id || null,
      status: "waiting",
    })
    .select("id, number")
    .single();

  if (error) return { error: error.message };
  return { data };
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add app/q/\[slug\]/actions.ts
git commit -m "feat: add date parameter and validation to joinQueue, fix is_open security gap"
```

---

### Task 3: Add date picker to public queue page and form

**Files:**
- Modify: `app/q/[slug]/page.tsx`
- Modify: `app/q/[slug]/JoinQueueForm.tsx`

- [ ] **Step 1: Update page.tsx to support date selection**

Replace the entire contents of `app/q/[slug]/page.tsx` with:

```tsx
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import JoinQueueForm from "./JoinQueueForm";

export default async function PublicQueuePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ date?: string }>;
}) {
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;
  const supabase = await createClient();

  const { data: barbershop } = await supabase
    .from("barbershops")
    .select("id, name, city, address, settings_json")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (!barbershop) notFound();

  const today = new Date().toISOString().split("T")[0];
  const selectedDate = resolvedSearchParams.date ?? today;

  // Calculate max booking date from settings
  const settings = (barbershop.settings_json as Record<string, unknown>) ?? {};
  const maxDays = (settings.booking_max_days as number) ?? 7;
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + maxDays);
  const maxDateStr = maxDate.toISOString().split("T")[0];

  // Validate selected date range
  const validDate = selectedDate >= today && selectedDate <= maxDateStr
    ? selectedDate
    : today;

  const [{ data: queue }, { data: services }, { data: barbers }] =
    await Promise.all([
      supabase
        .from("queues")
        .select("id, is_open, total_served")
        .eq("barbershop_id", barbershop.id)
        .eq("date", validDate)
        .maybeSingle(),
      supabase
        .from("services")
        .select("id, name, price, duration_min")
        .eq("barbershop_id", barbershop.id)
        .eq("is_active", true),
      supabase
        .from("barbers")
        .select("id, display_name")
        .eq("barbershop_id", barbershop.id)
        .eq("is_active", true),
    ]);

  const { count: waitingCount } =
    queue?.is_open
      ? await supabase
          .from("queue_entries")
          .select("id", { count: "exact", head: true })
          .eq("queue_id", queue.id)
          .in("status", ["waiting", "called", "serving"])
      : { count: 0 };

  const isOpen = !!queue?.is_open;

  return (
    <div className="min-h-screen bg-dark-950">
      <div className="bg-dark-900/80 border-b border-dark-800/50 px-4 py-4 text-center">
        <span className="font-display text-sm font-bold text-white">
          Kapster
        </span>
      </div>

      <div className="max-w-md mx-auto px-4 py-8 space-y-6">
        {/* Shop info */}
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl gold-gradient flex items-center justify-center mx-auto mb-4">
            <span className="font-display text-xl font-bold text-dark-900">
              {barbershop.name[0]}
            </span>
          </div>
          <h1 className="font-display text-2xl font-bold text-white">
            {barbershop.name}
          </h1>
          {barbershop.city && (
            <p className="text-dark-400 text-sm mt-1">{barbershop.city}</p>
          )}
        </div>

        {/* Date picker — always visible */}
        <div className="bg-dark-800/50 border border-dark-700/30 rounded-2xl p-4">
          <label className="block text-dark-400 text-sm mb-2">
            Pilih Tanggal Antrian
          </label>
          <input
            type="date"
            min={today}
            max={maxDateStr}
            value={validDate}
            onChange={(e) => {
              const url = new URL(window.location.href);
              url.searchParams.set("date", e.target.value);
              window.location.href = url.toString();
            }}
            className="w-full px-4 py-3 rounded-xl bg-dark-700/50 border border-dark-600/50 text-white text-sm focus:outline-none focus:border-barber-400/50 transition-colors"
          />
          {validDate !== today && (
            <p className="text-barber-400 text-xs mt-2">
              Antrian untuk tanggal{" "}
              {new Date(validDate + "T00:00:00").toLocaleDateString("id-ID", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          )}
        </div>

        {/* Stats — only show if queue exists */}
        {queue && (
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-barber-400/10 border border-barber-400/20 rounded-xl p-4 text-center">
              <p className="font-display text-3xl font-bold text-barber-400">
                {waitingCount ?? 0}
              </p>
              <p className="text-dark-400 text-sm mt-1">Sedang Menunggu</p>
            </div>
            <div className="bg-dark-800/50 border border-dark-700/30 rounded-xl p-4 text-center">
              <p className="font-display text-3xl font-bold text-white">
                {queue?.total_served ?? 0}
              </p>
              <p className="text-dark-400 text-sm mt-1">Selesai Hari Ini</p>
            </div>
          </div>
        )}

        {/* Queue closed message for today only */}
        {!isOpen && validDate === today ? (
          <div className="bg-dark-800/50 border border-dark-700/30 rounded-2xl p-6 text-center">
            <div className="w-12 h-12 rounded-xl bg-dark-700/50 flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-6 h-6 text-dark-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <p className="text-dark-300 font-semibold">Antrian Hari Ini Belum Dibuka</p>
            <p className="text-dark-500 text-sm mt-1">
              Silakan pilih tanggal lain atau tunggu hingga barbershop buka
            </p>
          </div>
        ) : null}

        {/* Join form — always rendered, server action handles validation */}
        <JoinQueueForm
          barbershopId={barbershop.id}
          date={validDate}
          slug={slug}
          services={services ?? []}
          barbers={barbers ?? []}
          isOpen={isOpen}
          selectedDate={validDate}
          today={today}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Update JoinQueueForm to accept date parameter**

Replace the entire contents of `app/q/[slug]/JoinQueueForm.tsx` with:

```tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { joinQueue } from "./actions";

interface Props {
  barbershopId: string;
  date: string;
  slug: string;
  services: { id: string; name: string; price: number }[];
  barbers: { id: string; display_name: string }[];
  isOpen: boolean;
  selectedDate: string;
  today: string;
}

export default function JoinQueueForm({
  barbershopId,
  date,
  slug,
  services,
  barbers,
  isOpen,
  selectedDate,
  today,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    customer_name: "",
    phone: "",
    service_id: "",
    barber_id: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customer_name.trim()) return;
    setError("");

    startTransition(async () => {
      const result = await joinQueue(barbershopId, date, {
        customer_name: form.customer_name,
        phone: form.phone || undefined,
        service_id: form.service_id || undefined,
        barber_id: form.barber_id || undefined,
      });

      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.data) {
        router.push(`/q/${slug}/status/${result.data.id}`);
      }
    });
  };

  const isFutureDate = selectedDate > today;

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-dark-800/50 border border-dark-700/30 rounded-2xl p-6 space-y-4"
    >
      <h2 className="font-semibold text-white">
        {isFutureDate ? "Daftar Antrian" : isOpen ? "Daftar Antrian" : "Daftar Antrian"}
      </h2>

      {error && (
        <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      <div>
        <label className="block text-dark-400 text-sm mb-1.5">
          Nama <span className="text-barber-400">*</span>
        </label>
        <input
          type="text"
          required
          value={form.customer_name}
          onChange={(e) =>
            setForm((f) => ({ ...f, customer_name: e.target.value }))
          }
          placeholder="Nama lengkap"
          className="w-full px-4 py-3 rounded-xl bg-dark-700/50 border border-dark-600/50 text-white placeholder-dark-500 focus:outline-none focus:border-barber-400/50 transition-colors"
        />
      </div>

      <div>
        <label className="block text-dark-400 text-sm mb-1.5">No. HP</label>
        <input
          type="tel"
          value={form.phone}
          onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          placeholder="08xxxxxxxxxx"
          className="w-full px-4 py-3 rounded-xl bg-dark-700/50 border border-dark-600/50 text-white placeholder-dark-500 focus:outline-none focus:border-barber-400/50 transition-colors"
        />
      </div>

      {services.length > 0 && (
        <div>
          <label className="block text-dark-400 text-sm mb-1.5">Layanan</label>
          <select
            value={form.service_id}
            onChange={(e) =>
              setForm((f) => ({ ...f, service_id: e.target.value }))
            }
            className="w-full px-4 py-3 rounded-xl bg-dark-700/50 border border-dark-600/50 text-white focus:outline-none focus:border-barber-400/50 transition-colors"
          >
            <option value="">Pilih layanan...</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} — Rp{s.price.toLocaleString("id-ID")}
              </option>
            ))}
          </select>
        </div>
      )}

      {barbers.length > 1 && (
        <div>
          <label className="block text-dark-400 text-sm mb-1.5">
            Pilih Barber
          </label>
          <select
            value={form.barber_id}
            onChange={(e) =>
              setForm((f) => ({ ...f, barber_id: e.target.value }))
            }
            className="w-full px-4 py-3 rounded-xl bg-dark-700/50 border border-dark-600/50 text-white focus:outline-none focus:border-barber-400/50 transition-colors"
          >
            <option value="">Barber manapun</option>
            {barbers.map((b) => (
              <option key={b.id} value={b.id}>
                {b.display_name}
              </option>
            ))}
          </select>
        </div>
      )}

      <button
        type="submit"
        disabled={isPending || !form.customer_name.trim()}
        className="w-full py-3 rounded-xl gold-gradient text-dark-900 font-bold transition-all hover:shadow-lg hover:shadow-barber-400/25 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isPending
          ? "Mendaftar..."
          : isFutureDate
          ? "Daftar Antrian"
          : isOpen
          ? "Daftar Sekarang"
          : "Daftar Antrian"}
      </button>
    </form>
  );
}
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add app/q/\[slug\]/page.tsx app/q/\[slug\]/JoinQueueForm.tsx
git commit -m "feat: add date picker to public queue page, always show form"
```

---

### Task 4: Update status page to show future queue info

**Files:**
- Modify: `app/q/[slug]/status/[id]/page.tsx`

- [ ] **Step 1: Update status page to query queue date and show appropriate messages**

Replace the entire contents of `app/q/[slug]/status/[id]/page.tsx` with:

```tsx
"use client";

import { use, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

type Entry = {
  id: string;
  number: number;
  customer_name: string;
  status: "waiting" | "called" | "serving" | "done" | "skip";
  queue_id: string;
};

type Queue = {
  id: string;
  date: string;
  is_open: boolean;
};

const STATUS_INFO = {
  waiting: {
    label: "Menunggu Giliran",
    color: "text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/20",
  },
  called: {
    label: "Giliran Anda!",
    color: "text-barber-400",
    bg: "bg-barber-400/10 border-barber-400/20",
  },
  serving: {
    label: "Sedang Dilayani",
    color: "text-green-400",
    bg: "bg-green-500/10 border-green-500/20",
  },
  done: {
    label: "Selesai",
    color: "text-dark-400",
    bg: "bg-dark-700/50 border-dark-700/30",
  },
  skip: {
    label: "Dilewati",
    color: "text-dark-400",
    bg: "bg-dark-700/50 border-dark-700/30",
  },
} as const;

export default function StatusPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = use(params);
  const [entry, setEntry] = useState<Entry | null>(null);
  const [queue, setQueue] = useState<Queue | null>(null);
  const [waitingBefore, setWaitingBefore] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    let channelCleanup: (() => void) | null = null;

    async function fetchData() {
      const { data } = await supabase
        .from("queue_entries")
        .select("id, number, customer_name, status, queue_id")
        .eq("id", id)
        .single();

      if (!data) {
        setLoading(false);
        return;
      }

      setEntry(data as Entry);

      // Fetch queue info for date and is_open
      const { data: queueData } = await supabase
        .from("queues")
        .select("id, date, is_open")
        .eq("id", (data as Entry).queue_id)
        .single();

      if (queueData) {
        setQueue(queueData as Queue);
      }

      const { count } = await supabase
        .from("queue_entries")
        .select("id", { count: "exact", head: true })
        .eq("queue_id", data.queue_id)
        .lt("number", data.number)
        .in("status", ["waiting", "called", "serving"]);

      setWaitingBefore(count ?? 0);
      setLoading(false);

      // Subscribe for updates to this queue
      const channel = supabase
        .channel(`status-${id}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "queue_entries",
            filter: `queue_id=eq.${data.queue_id}`,
          },
          () => {
            fetchData();
          }
        )
        .subscribe();

      channelCleanup = () => supabase.removeChannel(channel);
    }

    fetchData();

    return () => {
      if (channelCleanup) channelCleanup();
    };
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="text-dark-400 text-sm">Memuat...</div>
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-dark-300 mb-4">Antrian tidak ditemukan</p>
          <Link href={`/q/${slug}`} className="text-barber-400 text-sm">
            ← Kembali
          </Link>
        </div>
      </div>
    );
  }

  const today = new Date().toISOString().split("T")[0];
  const isFutureDate = queue ? queue.date > today : false;
  const info = STATUS_INFO[entry.status];

  return (
    <div className="min-h-screen bg-dark-950">
      <div className="bg-dark-900/80 border-b border-dark-800/50 px-4 py-4 text-center">
        <span className="font-display text-sm font-bold text-white">
          Kapster
        </span>
      </div>

      <div className="max-w-sm mx-auto px-4 py-12 space-y-8 text-center">
        {/* Number */}
        <div>
          <p className="text-dark-500 text-sm mb-3">Nomor Antrian Anda</p>
          <div className="font-display text-8xl font-bold text-barber-400 leading-none">
            {String(entry.number).padStart(2, "0")}
          </div>
          <p className="text-dark-300 mt-3 text-sm">{entry.customer_name}</p>
        </div>

        {/* Date info for future queues */}
        {isFutureDate && queue && (
          <div className="p-4 rounded-xl bg-barber-400/5 border border-barber-400/20">
            <p className="text-barber-400 font-semibold text-sm">
              Antrian untuk{" "}
              {new Date(queue.date + "T00:00:00").toLocaleDateString("id-ID", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
            <p className="text-dark-400 text-xs mt-1">
              Menunggu antrean dibuka oleh barbershop
            </p>
          </div>
        )}

        {/* Status */}
        {isFutureDate ? (
          <div className="p-6 rounded-2xl border bg-barber-400/5 border-barber-400/20">
            <p className="font-display text-xl font-bold text-barber-400">
              Terdaftar
            </p>
            <p className="text-dark-400 text-sm mt-2">
              Nomor antrian Anda sudah tercatat. Silakan cek kembali saat barbershop membuka antrean.
            </p>
          </div>
        ) : (
          <>
            <div className={`p-6 rounded-2xl border ${info.bg}`}>
              <p className={`font-display text-xl font-bold ${info.color}`}>
                {info.label}
              </p>
              {entry.status === "waiting" && (
                <p className="text-dark-400 text-sm mt-2">
                  {waitingBefore > 0
                    ? `${waitingBefore} orang di depan Anda · ~${waitingBefore * 20} menit`
                    : "Anda berikutnya!"}
                </p>
              )}
              {entry.status === "called" && (
                <p className="text-dark-400 text-sm mt-2">
                  Silakan menuju kursi barber
                </p>
              )}
              {entry.status === "serving" && (
                <p className="text-dark-400 text-sm mt-2">
                  Nikmati layanannya!
                </p>
              )}
              {entry.status === "done" && (
                <p className="text-dark-400 text-sm mt-2">
                  Terima kasih sudah berkunjung!
                </p>
              )}
              {entry.status === "skip" && (
                <p className="text-dark-400 text-sm mt-2">
                  Nomor antrian Anda telah dilewati
                </p>
              )}
            </div>
          </>
        )}

        <Link
          href={`/q/${slug}`}
          className="inline-block text-dark-500 text-sm hover:text-dark-300 transition-colors"
        >
          ← Halaman Antrian
        </Link>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add app/q/\[slug\]/status/\[id\]/page.tsx
git commit -m "feat: show future queue date and status on status page"
```

---

### Task 5: Add date navigation to dashboard queue page

**Files:**
- Modify: `app/dashboard/queue/page.tsx`
- Modify: `components/dashboard/QueueDashboard.tsx`

- [ ] **Step 1: Update dashboard queue page to accept date parameter**

Replace the entire contents of `app/dashboard/queue/page.tsx` with:

```tsx
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import QueueDashboard from "@/components/dashboard/QueueDashboard";

export const dynamic = "force-dynamic";

export default async function QueuePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: barbershop } = await supabase
    .from("barbershops")
    .select("id, name, slug, settings_json")
    .eq("owner_id", user.id)
    .single();
  if (!barbershop) redirect("/onboarding");

  const today = new Date().toISOString().split("T")[0];
  const selectedDate = resolvedSearchParams.date ?? today;

  // Calculate max booking date from settings
  const settings = (barbershop.settings_json as Record<string, unknown>) ?? {};
  const maxDays = (settings.booking_max_days as number) ?? 7;
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + maxDays);
  const maxDateStr = maxDate.toISOString().split("T")[0];

  // Validate selected date range (allow past dates for history viewing)
  const validDate = selectedDate >= today ? selectedDate : today;

  const [{ data: queue }, { data: barbers }, { data: services }, { data: subscription }] =
    await Promise.all([
      supabase
        .from("queues")
        .select("id, is_open, total_served")
        .eq("barbershop_id", barbershop.id)
        .eq("date", validDate)
        .maybeSingle(),
      supabase
        .from("barbers")
        .select("id, display_name")
        .eq("barbershop_id", barbershop.id)
        .eq("is_active", true),
      supabase
        .from("services")
        .select("id, name, price, duration_min")
        .eq("barbershop_id", barbershop.id)
        .eq("is_active", true),
      supabase
        .from("subscriptions")
        .select("max_queue_per_day, max_barbers")
        .eq("barbershop_id", barbershop.id)
        .single(),
    ]);

  const { data: initialEntries } = queue
    ? await supabase
        .from("queue_entries")
        .select(
          "id, number, customer_name, phone, status, barber_id, service_id, joined_at, called_at, serving_at, done_at"
        )
        .eq("queue_id", queue.id)
        .order("number", { ascending: true })
    : { data: [] };

  // Count pre-booked entries if future date and queue not open
  const isFutureDate = validDate > today;
  const preBookedCount =
    isFutureDate && queue && !queue.is_open
      ? (initialEntries ?? []).length
      : 0;

  return (
    <QueueDashboard
      barbershop={barbershop}
      queue={queue ?? null}
      initialEntries={initialEntries ?? []}
      barbers={barbers ?? []}
      services={services ?? []}
      maxPerDay={subscription?.max_queue_per_day ?? 20}
      selectedDate={validDate}
      today={today}
      maxDate={maxDateStr}
      preBookedCount={preBookedCount}
    />
  );
}
```

- [ ] **Step 2: Update QueueDashboard component to handle date navigation**

Replace the entire contents of `components/dashboard/QueueDashboard.tsx` with:

```tsx
"use client";

import { useState, useEffect, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  openTodayQueue,
  setQueueOpen,
  addQueueCustomer,
  setEntryStatus,
} from "@/app/dashboard/queue/actions";

type QueueData = { id: string; is_open: boolean; total_served: number } | null;

type Entry = {
  id: string;
  number: number;
  customer_name: string;
  phone: string | null;
  status: "waiting" | "called" | "serving" | "done" | "skip";
  barber_id: string | null;
  service_id: string | null;
  joined_at: string;
  called_at: string | null;
  serving_at: string | null;
  done_at: string | null;
};

type Barber = { id: string; display_name: string };
type Service = { id: string; name: string; price: number; duration_min: number };

interface Props {
  barbershop: { id: string; name: string; slug: string };
  queue: QueueData;
  initialEntries: Entry[];
  barbers: Barber[];
  services: Service[];
  maxPerDay: number;
  selectedDate: string;
  today: string;
  maxDate: string;
  preBookedCount: number;
}

const STATUS_LABEL: Record<Entry["status"], string> = {
  waiting: "Menunggu",
  called: "Dipanggil",
  serving: "Dilayani",
  done: "Selesai",
  skip: "Skip",
};

const STATUS_COLOR: Record<Entry["status"], string> = {
  waiting: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  called: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  serving: "bg-green-500/10 text-green-400 border-green-500/20",
  done: "bg-dark-700/50 text-dark-500 border-dark-700/30",
  skip: "bg-red-500/10 text-red-400 border-red-500/20",
};

export default function QueueDashboard({
  barbershop,
  queue: initialQueue,
  initialEntries,
  barbers,
  services,
  maxPerDay,
  selectedDate,
  today,
  maxDate,
  preBookedCount,
}: Props) {
  const [queue, setQueue] = useState<QueueData>(initialQueue);
  const [entries, setEntries] = useState<Entry[]>(initialEntries);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    customer_name: "",
    phone: "",
    barber_id: "",
    service_id: "",
  });

  const isFutureDate = selectedDate > today;

  useEffect(() => {
    if (!queue?.id) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`queue-${queue.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "queue_entries",
          filter: `queue_id=eq.${queue.id}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setEntries((prev) =>
              [...prev, payload.new as Entry].sort(
                (a, b) => a.number - b.number
              )
            );
          } else if (payload.eventType === "UPDATE") {
            setEntries((prev) =>
              prev.map((e) =>
                e.id === (payload.new as Entry).id
                  ? { ...e, ...(payload.new as Entry) }
                  : e
              )
            );
          } else if (payload.eventType === "DELETE") {
            setEntries((prev) =>
              prev.filter((e) => e.id !== (payload.old as { id: string }).id)
            );
          }
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queue?.id]);

  const handleOpenQueue = () => {
    setError("");
    startTransition(async () => {
      const result = await openTodayQueue(barbershop.id);
      if ("error" in result && result.error) {
        setError(result.error);
        return;
      }
      if ("data" in result && result.data) setQueue(result.data);
    });
  };

  const handleToggleQueue = () => {
    if (!queue) return;
    setError("");
    startTransition(async () => {
      const result = await setQueueOpen(queue.id, !queue.is_open);
      if (result.error) {
        setError(result.error);
        return;
      }
      setQueue((q) => (q ? { ...q, is_open: !q.is_open } : q));
    });
  };

  const handleAddCustomer = () => {
    if (!queue || !form.customer_name.trim()) return;
    setError("");
    startTransition(async () => {
      const result = await addQueueCustomer(queue.id, maxPerDay, {
        customer_name: form.customer_name,
        phone: form.phone || undefined,
        barber_id: form.barber_id || undefined,
        service_id: form.service_id || undefined,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      setForm({ customer_name: "", phone: "", barber_id: "", service_id: "" });
      setShowAddForm(false);
    });
  };

  const handleStatusChange = (
    entryId: string,
    status: "called" | "serving" | "done" | "skip"
  ) => {
    setError("");
    startTransition(async () => {
      const result = await setEntryStatus(entryId, status, queue?.id);
      if (result.error) setError(result.error);
      if (status === "done") {
        setQueue((q) =>
          q ? { ...q, total_served: q.total_served + 1 } : q
        );
      }
    });
  };

  const stats = {
    waiting: entries.filter((e) => e.status === "waiting").length,
    called: entries.filter((e) => e.status === "called").length,
    serving: entries.filter((e) => e.status === "serving").length,
  };
  const activeEntries = entries.filter(
    (e) => !["done", "skip"].includes(e.status)
  );
  const finishedEntries = entries.filter((e) =>
    ["done", "skip"].includes(e.status)
  );

  const formattedDate = new Date(selectedDate + "T00:00:00").toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">
            Antrian
          </h1>
          <p className="text-dark-400 text-sm">{formattedDate}</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Date picker */}
          <input
            type="date"
            min={today}
            max={maxDate}
            value={selectedDate}
            onChange={(e) => {
              const url = new URL(window.location.href);
              url.searchParams.set("date", e.target.value);
              window.location.href = url.toString();
            }}
            className="px-4 py-2.5 rounded-xl bg-dark-800/50 border border-dark-700/30 text-white text-sm focus:outline-none focus:border-barber-400/50"
          />

          {queue ? (
            <>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium border ${
                  queue.is_open
                    ? "bg-green-500/10 text-green-400 border-green-500/20"
                    : "bg-dark-700/50 text-dark-400 border-dark-700/30"
                }`}
              >
                {queue.is_open ? "Buka" : "Tutup"}
              </span>
              <button
                onClick={handleToggleQueue}
                disabled={isPending}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 ${
                  queue.is_open
                    ? "bg-dark-700 text-dark-200 hover:bg-dark-600"
                    : "gold-gradient text-dark-900"
                }`}
              >
                {queue.is_open ? "Tutup Antrian" : "Buka Antrian"}
              </button>
            </>
          ) : (
            <button
              onClick={handleOpenQueue}
              disabled={isPending}
              className="px-5 py-2.5 rounded-xl gold-gradient text-dark-900 font-bold text-sm disabled:opacity-50"
            >
              {isPending ? "Membuka..." : "Buka Antrian"}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Pre-booking badge */}
      {isFutureDate && preBookedCount > 0 && (
        <div className="px-4 py-3 rounded-xl bg-barber-400/10 border border-barber-400/20 text-barber-400 text-sm">
          <span className="font-semibold">{preBookedCount}</span> pelanggan sudah terdaftar untuk tanggal ini
        </div>
      )}

      {/* Stats */}
      {queue && (
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Menunggu", value: stats.waiting, color: "text-blue-400" },
            {
              label: "Dipanggil",
              value: stats.called,
              color: "text-yellow-400",
            },
            {
              label: "Dilayani",
              value: stats.serving,
              color: "text-green-400",
            },
            {
              label: "Selesai",
              value: queue.total_served,
              color: "text-dark-400",
            },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-dark-800/50 border border-dark-700/30 rounded-xl p-4 text-center"
            >
              <p className={`font-display text-2xl font-bold ${s.color}`}>
                {s.value}
              </p>
              <p className="text-dark-500 text-xs mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Add Customer */}
      {queue?.is_open && (
        <div className="bg-dark-800/50 border border-dark-700/30 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white text-sm">
              Tambah Pelanggan
            </h2>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-barber-400 border border-barber-400/30 hover:bg-barber-400/10 transition-colors"
            >
              {showAddForm ? "Tutup" : "+ Tambah"}
            </button>
          </div>

          {showAddForm && (
            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-dark-400 text-xs mb-1.5">
                    Nama Pelanggan <span className="text-barber-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.customer_name}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        customer_name: e.target.value,
                      }))
                    }
                    placeholder="John Doe"
                    className="w-full px-3 py-2.5 rounded-xl bg-dark-700/50 border border-dark-600/50 text-white placeholder-dark-500 text-sm focus:outline-none focus:border-barber-400/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-dark-400 text-xs mb-1.5">
                    No. HP
                  </label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, phone: e.target.value }))
                    }
                    placeholder="08xxxxxxxxxx"
                    className="w-full px-3 py-2.5 rounded-xl bg-dark-700/50 border border-dark-600/50 text-white placeholder-dark-500 text-sm focus:outline-none focus:border-barber-400/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-dark-400 text-xs mb-1.5">
                    Layanan
                  </label>
                  <select
                    value={form.service_id}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, service_id: e.target.value }))
                    }
                    className="w-full px-3 py-2.5 rounded-xl bg-dark-700/50 border border-dark-600/50 text-white text-sm focus:outline-none focus:border-barber-400/50 transition-colors"
                  >
                    <option value="">Pilih layanan...</option>
                    {services.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} — Rp{s.price.toLocaleString("id-ID")}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-dark-400 text-xs mb-1.5">
                    Barber
                  </label>
                  <select
                    value={form.barber_id}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, barber_id: e.target.value }))
                    }
                    className="w-full px-3 py-2.5 rounded-xl bg-dark-700/50 border border-dark-600/50 text-white text-sm focus:outline-none focus:border-barber-400/50 transition-colors"
                  >
                    <option value="">Barber manapun</option>
                    {barbers.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.display_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <button
                onClick={handleAddCustomer}
                disabled={isPending || !form.customer_name.trim()}
                className="px-5 py-2.5 rounded-xl gold-gradient text-dark-900 font-bold text-sm disabled:opacity-50 transition-all"
              >
                {isPending ? "Menambahkan..." : "Tambah ke Antrian"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Queue list */}
      {queue && (
        <div className="space-y-4">
          {activeEntries.length > 0 ? (
            <div className="bg-dark-800/50 border border-dark-700/30 rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-dark-700/30">
                <h2 className="font-semibold text-white text-sm">
                  Antrian Aktif
                </h2>
              </div>
              <div className="divide-y divide-dark-700/30">
                {activeEntries.map((entry) => (
                  <EntryRow
                    key={entry.id}
                    entry={entry}
                    barbers={barbers}
                    services={services}
                    onStatusChange={handleStatusChange}
                    isPending={isPending}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-dark-800/50 border border-dark-700/30 rounded-2xl p-10 text-center">
              <p className="text-dark-400 text-sm">Antrian kosong</p>
              {queue.is_open && (
                <p className="text-dark-600 text-xs mt-1">
                  Tambahkan pelanggan di atas
                </p>
              )}
              {isFutureDate && (
                <p className="text-dark-600 text-xs mt-1">
                  Belum ada pelanggan yang mendaftar untuk tanggal ini
                </p>
              )}
            </div>
          )}

          {finishedEntries.length > 0 && (
            <div className="bg-dark-800/50 border border-dark-700/30 rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-dark-700/30">
                <h2 className="font-semibold text-dark-400 text-sm">
                  Selesai
                </h2>
              </div>
              <div className="divide-y divide-dark-700/30">
                {finishedEntries.map((entry) => (
                  <EntryRow
                    key={entry.id}
                    entry={entry}
                    barbers={barbers}
                    services={services}
                    onStatusChange={handleStatusChange}
                    isPending={isPending}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function EntryRow({
  entry,
  barbers,
  services,
  onStatusChange,
  isPending,
}: {
  entry: Entry;
  barbers: Barber[];
  services: Service[];
  onStatusChange: (
    id: string,
    status: "called" | "serving" | "done" | "skip"
  ) => void;
  isPending: boolean;
}) {
  const barber = barbers.find((b) => b.id === entry.barber_id);
  const service = services.find((s) => s.id === entry.service_id);

  return (
    <div className="flex items-center gap-4 px-5 py-4">
      <div className="w-10 h-10 rounded-xl bg-barber-400/10 border border-barber-400/20 flex items-center justify-center shrink-0">
        <span className="font-display font-bold text-barber-400 text-sm">
          {String(entry.number).padStart(2, "0")}
        </span>
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-white font-medium text-sm truncate">
          {entry.customer_name}
        </p>
        <p className="text-dark-500 text-xs mt-0.5 truncate">
          {[
            entry.phone,
            service?.name,
            barber ? `→ ${barber.display_name}` : null,
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </div>

      <span
        className={`px-2.5 py-1 rounded-lg text-xs font-medium border shrink-0 ${STATUS_COLOR[entry.status]}`}
      >
        {STATUS_LABEL[entry.status]}
      </span>

      <div className="flex items-center gap-2 shrink-0">
        {entry.status === "waiting" && (
          <>
            <button
              onClick={() => onStatusChange(entry.id, "called")}
              disabled={isPending}
              className="px-3 py-1.5 rounded-lg bg-barber-400/10 text-barber-400 text-xs font-medium hover:bg-barber-400/20 transition-colors disabled:opacity-50"
            >
              Panggil
            </button>
            <button
              onClick={() => onStatusChange(entry.id, "skip")}
              disabled={isPending}
              className="px-3 py-1.5 rounded-lg bg-dark-700/50 text-dark-400 text-xs hover:bg-dark-700 transition-colors disabled:opacity-50"
            >
              Skip
            </button>
          </>
        )}
        {entry.status === "called" && (
          <>
            <button
              onClick={() => onStatusChange(entry.id, "serving")}
              disabled={isPending}
              className="px-3 py-1.5 rounded-lg bg-green-500/10 text-green-400 text-xs font-medium hover:bg-green-500/20 transition-colors disabled:opacity-50"
            >
              Layani
            </button>
            <button
              onClick={() => onStatusChange(entry.id, "skip")}
              disabled={isPending}
              className="px-3 py-1.5 rounded-lg bg-dark-700/50 text-dark-400 text-xs hover:bg-dark-700 transition-colors disabled:opacity-50"
            >
              Skip
            </button>
          </>
        )}
        {entry.status === "serving" && (
          <button
            onClick={() => onStatusChange(entry.id, "done")}
            disabled={isPending}
            className="px-3 py-1.5 rounded-lg bg-green-500/20 text-green-300 text-xs font-medium hover:bg-green-500/30 transition-colors disabled:opacity-50"
          >
            Selesai
          </button>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add app/dashboard/queue/page.tsx components/dashboard/QueueDashboard.tsx
git commit -m "feat: add date navigation and pre-booking badge to dashboard queue"
```

---

### Task 6: Final verification

- [ ] **Step 1: Run full TypeScript check**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 2: Run lint**

Run: `npm run lint 2>&1 | head -20`
Expected: No errors. (If lint script doesn't exist, skip.)

- [ ] **Step 3: Verify build**

Run: `npm run build 2>&1 | tail -20`
Expected: Build succeeds.

- [ ] **Step 4: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix: address any remaining type/lint issues"
```

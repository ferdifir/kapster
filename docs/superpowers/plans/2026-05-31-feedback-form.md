# Feedback Form Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a feedback/kritik-saran page to the dashboard with form submission, Telegram notification, and inbox management.

**Architecture:** New `/dashboard/feedback` tabbed page (Kirim Feedback + Inbox tabs). Feedback stored in new `feedback` Supabase table. Screenshots uploaded via existing `/api/upload` endpoint. Telegram sent via Bot API from server action.

**Tech Stack:** Next.js 16 App Router, Supabase (Postgres + Storage), Telegram Bot API, Tailwind CSS v4

---

### Task 1: Database Migration

**Files:**
- Create: `supabase/migrations/add_feedback_table.sql`

- [ ] **Write the migration file**

```sql
CREATE TABLE public.feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id uuid NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
  profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  name text NOT NULL,
  category text NOT NULL CHECK (category IN ('kritik', 'saran', 'feedback', 'request_fitur')),
  message text NOT NULL,
  screenshot_url text,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can read feedback"
ON public.feedback FOR SELECT
USING (
  barbershop_id IN (SELECT id FROM public.barbershops WHERE owner_id = auth.uid())
);

CREATE POLICY "Authenticated users can insert feedback"
ON public.feedback FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Owners can update feedback"
ON public.feedback FOR UPDATE
USING (
  barbershop_id IN (SELECT id FROM public.barbershops WHERE owner_id = auth.uid())
);

CREATE POLICY "Owners can delete feedback"
ON public.feedback FOR DELETE
USING (
  barbershop_id IN (SELECT id FROM public.barbershops WHERE owner_id = auth.uid())
);

INSERT INTO storage.buckets (id, name, public)
VALUES ('feedback', 'feedback', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Feedback screenshots are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'feedback');

CREATE POLICY "Authenticated users can upload feedback screenshots"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'feedback' AND auth.role() = 'authenticated'
  AND (SELECT owner_id FROM public.barbershops WHERE id = (storage.foldername(name))[1]::uuid) = auth.uid()
);

CREATE POLICY "Owners can delete feedback screenshots"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'feedback' AND auth.role() = 'authenticated'
  AND (SELECT owner_id FROM public.barbershops WHERE id = (storage.foldername(name))[1]::uuid) = auth.uid()
);
```

- [ ] **Commit**

```bash
git add supabase/migrations/add_feedback_table.sql
git commit -m "feat: add feedback table and storage bucket"
```

---

### Task 2: Update Supabase types

**Files:**
- Modify: `lib/supabase/types.ts`

- [ ] **Add `feedback` table entry to the Database type**

Insert this block after the `payments` closing brace (before `    }` that ends the `Tables` block):

```typescript
      feedback: {
        Row: {
          id: string
          barbershop_id: string
          profile_id: string | null
          name: string
          category: string
          message: string
          screenshot_url: string | null
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          barbershop_id: string
          profile_id?: string | null
          name: string
          category: string
          message: string
          screenshot_url?: string | null
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          barbershop_id?: string
          profile_id?: string | null
          name?: string
          category?: string
          message?: string
          screenshot_url?: string | null
          is_read?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: false
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
```

- [ ] **Commit**

```bash
git add lib/supabase/types.ts
git commit -m "feat: add Feedback type to Database types"
```

---

### Task 3: Telegram notification helper

**Files:**
- Create: `lib/telegram.ts`

- [ ] **Create `lib/telegram.ts`**

```typescript
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID!;

export async function sendTelegramNotification(text: string): Promise<void> {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.warn("Telegram not configured: missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID");
    return;
  }

  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text,
        parse_mode: "HTML",
      }),
    });

    if (!res.ok) {
      const errorBody = await res.text();
      console.error("Telegram send error:", errorBody);
    }
  } catch (err) {
    console.error("Telegram send failed:", err);
  }
}
```

- [ ] **Add env vars to `.env.example`** (if it exists)

Check if `.env.example` exists — if so, add:
```
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
```

- [ ] **Commit**

```bash
git add lib/telegram.ts
git commit -m "feat: add Telegram notification helper"
```

---

### Task 4: Server Actions

**Files:**
- Create: `app/dashboard/feedback/actions.ts`

- [ ] **Create `app/dashboard/feedback/actions.ts`**

```typescript
"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { sendTelegramNotification } from "@/lib/telegram";

export async function submitFeedback(form: {
  barbershopId: string;
  profileId: string | null;
  name: string;
  category: string;
  message: string;
  screenshotUrl: string | null;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { error: insertError } = await supabase.from("feedback").insert({
    barbershop_id: form.barbershopId,
    profile_id: form.profileId,
    name: form.name.trim(),
    category: form.category,
    message: form.message.trim(),
    screenshot_url: form.screenshotUrl,
  });

  if (insertError) return { error: insertError.message };

  const { data: barbershop } = await supabase
    .from("barbershops")
    .select("name")
    .eq("id", form.barbershopId)
    .single();

  const truncated = form.message.length > 200 ? form.message.slice(0, 200) + "..." : form.message;

  const categoryLabels: Record<string, string> = {
    kritik: "Kritik", saran: "Saran", feedback: "Feedback", request_fitur: "Request Fitur",
  };

  const notification = [
    `📩 <b>Feedback Baru dari ${form.name}</b>`,
    `🏪 ${barbershop?.name ?? "Barbershop"}`,
    `📂 Kategori: ${categoryLabels[form.category] ?? form.category}`,
    ``,
    truncated,
  ].join("\n");

  sendTelegramNotification(notification);

  revalidatePath("/dashboard/feedback");
  return {};
}

export async function getFeedbackList(barbershopId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized", data: [] };

  const { data, error } = await supabase
    .from("feedback")
    .select("*")
    .eq("barbershop_id", barbershopId)
    .order("created_at", { ascending: false });

  if (error) return { error: error.message, data: [] };
  return { data, error: null };
}

export async function markFeedbackAsRead(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { error } = await supabase.from("feedback").update({ is_read: true }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/dashboard/feedback");
  return {};
}

export async function deleteFeedback(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: feedback } = await supabase
    .from("feedback")
    .select("screenshot_url")
    .eq("id", id)
    .single();

  if (feedback?.screenshot_url) {
    try {
      const url = new URL(feedback.screenshot_url);
      const pathParts = url.pathname.split("/storage/v1/object/public/feedback/");
      if (pathParts.length === 2) {
        const { createAdminClient } = await import("@/lib/supabase/admin");
        const admin = createAdminClient();
        await admin.storage.from("feedback").remove([decodeURIComponent(pathParts[1])]);
      }
    } catch { /* ignore */ }
  }

  const { error } = await supabase.from("feedback").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/dashboard/feedback");
  return {};
}
```

- [ ] **Commit**

```bash
git add app/dashboard/feedback/actions.ts
git commit -m "feat: add feedback server actions"
```

---

### Task 5: Feedback Form Component

**Files:**
- Create: `components/dashboard/FeedbackForm.tsx`

- [ ] **Create `components/dashboard/FeedbackForm.tsx`**

```typescript
"use client";

import { useState, useRef } from "react";
import { submitFeedback } from "@/app/dashboard/feedback/actions";

interface FeedbackFormProps {
  barbershopId: string;
  profileId: string | null;
  profileName: string | null;
}

const categories = [
  { value: "feedback", label: "Feedback" },
  { value: "saran", label: "Saran" },
  { value: "kritik", label: "Kritik" },
  { value: "request_fitur", label: "Request Fitur" },
];

export default function FeedbackForm({ barbershopId, profileId, profileName }: FeedbackFormProps) {
  const [name, setName] = useState(profileName ?? "");
  const [category, setCategory] = useState("feedback");
  const [message, setMessage] = useState("");
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");
    setUploading(true);

    if (!["image/png", "image/jpeg", "image/webp", "image/gif"].includes(file.type)) {
      setError("File harus berupa gambar (PNG, JPG, WebP, atau GIF)");
      setUploading(false);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Ukuran file maksimal 5MB");
      setUploading(false);
      return;
    }

    try {
      const ext = file.type.split("/")[1];
      const fileName = `screenshot_${Date.now()}.${ext}`;
      const filePath = `${barbershopId}/${fileName}`;
      const formData = new FormData();
      formData.append("file", file);
      formData.append("bucket", "feedback");
      formData.append("path", filePath);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengupload");
      setScreenshotUrl(data.url);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal mengupload screenshot";
      setError(msg);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!name.trim()) { setError("Nama harus diisi"); return; }
    if (!message.trim()) { setError("Pesan harus diisi"); return; }

    setSubmitting(true);
    try {
      const result = await submitFeedback({
        barbershopId, profileId,
        name: name.trim(), category,
        message: message.trim(), screenshotUrl,
      });
      if (result.error) { setError(result.error); return; }
      setSuccess(true);
      setName(profileName ?? "");
      setCategory("feedback");
      setMessage("");
      setScreenshotUrl(null);
      setTimeout(() => setSuccess(false), 5000);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
      )}
      {success && (
        <div className="px-4 py-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
          Feedback berhasil dikirim! Terima kasih atas masukannya.
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-dark-200 mb-1.5">Nama</label>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)}
          placeholder="Nama Anda"
          className="w-full px-4 py-2.5 rounded-xl bg-dark-800/50 border border-dark-700/30 text-white placeholder-dark-500 focus:outline-none focus:border-barber-400/50 transition-colors" />
      </div>

      <div>
        <label className="block text-sm font-medium text-dark-200 mb-1.5">Kategori</label>
        <select value={category} onChange={(e) => setCategory(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl bg-dark-800/50 border border-dark-700/30 text-white focus:outline-none focus:border-barber-400/50 transition-colors">
          {categories.map((cat) => (
            <option key={cat.value} value={cat.value}>{cat.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-dark-200 mb-1.5">Pesan</label>
        <textarea value={message} onChange={(e) => setMessage(e.target.value)}
          rows={5} placeholder="Tulis kritik, saran, feedback, atau request fitur Anda di sini..."
          className="w-full px-4 py-2.5 rounded-xl bg-dark-800/50 border border-dark-700/30 text-white placeholder-dark-500 focus:outline-none focus:border-barber-400/50 transition-colors resize-y" />
      </div>

      <div>
        <label className="block text-sm font-medium text-dark-200 mb-1.5">
          Screenshot <span className="text-dark-500">(opsional)</span>
        </label>
        <div className="flex items-center gap-4">
          <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading}
            className="px-4 py-2 rounded-xl border border-dark-700/30 text-dark-300 text-sm hover:bg-dark-800/50 transition-colors disabled:opacity-50">
            {uploading ? "Mengupload..." : "Pilih File"}
          </button>
          {screenshotUrl && (
            <div className="relative">
              <img src={screenshotUrl} alt="Preview" className="h-16 w-16 rounded-lg object-cover border border-dark-700/30" />
              <button type="button" onClick={() => setScreenshotUrl(null)}
                className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center hover:bg-red-600">×</button>
            </div>
          )}
          <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={handleFileChange} className="hidden" />
        </div>
        <p className="text-dark-500 text-xs mt-1">PNG, JPG, WebP, atau GIF. Maks 5MB.</p>
      </div>

      <button type="submit" disabled={submitting}
        className="px-6 py-2.5 rounded-xl gold-gradient text-dark-900 font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50">
        {submitting ? "Mengirim..." : "Kirim Feedback"}
      </button>
    </form>
  );
}
```

- [ ] **Commit**

```bash
git add components/dashboard/FeedbackForm.tsx
git commit -m "feat: add FeedbackForm component"
```

---

### Task 6: Feedback Inbox Component

**Files:**
- Create: `components/dashboard/FeedbackInbox.tsx`

- [ ] **Create `components/dashboard/FeedbackInbox.tsx`**

```typescript
"use client";

import { useState } from "react";
import { markFeedbackAsRead, deleteFeedback } from "@/app/dashboard/feedback/actions";
import type { Tables } from "@/lib/supabase/types";

type Feedback = Tables<"feedback">;

const categoryLabels: Record<string, string> = {
  kritik: "Kritik", saran: "Saran", feedback: "Feedback", request_fitur: "Request Fitur",
};

const categoryColors: Record<string, string> = {
  kritik: "text-red-400 bg-red-500/10 border-red-500/20",
  saran: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  feedback: "text-green-400 bg-green-500/10 border-green-500/20",
  request_fitur: "text-purple-400 bg-purple-500/10 border-purple-500/20",
};

interface FeedbackInboxProps {
  initialData: Feedback[];
}

export default function FeedbackInbox({ initialData }: FeedbackInboxProps) {
  const [items, setItems] = useState<Feedback[]>(initialData);
  const [selected, setSelected] = useState<Feedback | null>(null);

  const handleMarkRead = async (id: string) => {
    const result = await markFeedbackAsRead(id);
    if (!result.error) {
      setItems((prev) => prev.map((item) => item.id === id ? { ...item, is_read: true } : item));
    }
  };

  const handleDelete = async (id: string) => {
    const result = await deleteFeedback(id);
    if (!result.error) {
      setItems((prev) => prev.filter((item) => item.id !== id));
      if (selected?.id === id) setSelected(null);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  if (items.length === 0) {
    return (
      <div className="bg-dark-800/50 border border-dark-700/30 rounded-2xl p-12 text-center">
        <p className="text-dark-400">Belum ada feedback masuk</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-3">
        {items.map((item) => (
          <button key={item.id} type="button" onClick={() => setSelected(item)}
            className={`w-full text-left p-4 rounded-2xl border transition-all ${
              selected?.id === item.id ? "bg-barber-400/5 border-barber-400/20" : "bg-dark-800/50 border-dark-700/30 hover:bg-dark-800/80"
            }`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${categoryColors[item.category] ?? "text-dark-400 bg-dark-800 border-dark-700/30"}`}>
                    {categoryLabels[item.category] ?? item.category}
                  </span>
                  {!item.is_read && <span className="w-2 h-2 rounded-full bg-barber-400" />}
                </div>
                <p className="text-white font-medium text-sm truncate">{item.name}</p>
                <p className="text-dark-400 text-xs mt-1 line-clamp-2">{item.message}</p>
              </div>
              <span className="text-dark-500 text-xs shrink-0">{formatDate(item.created_at)}</span>
            </div>
          </button>
        ))}
      </div>

      <div>
        {selected ? (
          <div className="bg-dark-800/50 border border-dark-700/30 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${categoryColors[selected.category] ?? "text-dark-400 bg-dark-800 border-dark-700/30"}`}>
                {categoryLabels[selected.category] ?? selected.category}
              </span>
              <span className="text-dark-500 text-xs">{formatDate(selected.created_at)}</span>
            </div>
            <div>
              <p className="text-dark-400 text-xs mb-1">Dari</p>
              <p className="text-white font-medium">{selected.name}</p>
            </div>
            <div>
              <p className="text-dark-400 text-xs mb-1">Pesan</p>
              <p className="text-dark-100 text-sm whitespace-pre-wrap">{selected.message}</p>
            </div>
            {selected.screenshot_url && (
              <div>
                <p className="text-dark-400 text-xs mb-1">Screenshot</p>
                <a href={selected.screenshot_url} target="_blank" rel="noopener noreferrer">
                  <img src={selected.screenshot_url} alt="Feedback screenshot" className="max-w-full h-48 object-cover rounded-xl border border-dark-700/30" />
                </a>
              </div>
            )}
            <div className="flex gap-3 pt-2">
              {!selected.is_read && (
                <button type="button" onClick={() => handleMarkRead(selected.id)}
                  className="px-4 py-2 rounded-xl bg-dark-700/50 text-dark-200 text-sm hover:bg-dark-700 transition-colors">
                  Tandai Sudah Dibaca
                </button>
              )}
              <button type="button" onClick={() => handleDelete(selected.id)}
                className="px-4 py-2 rounded-xl bg-red-500/10 text-red-400 text-sm hover:bg-red-500/20 transition-colors">
                Hapus
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-dark-800/50 border border-dark-700/30 rounded-2xl p-12 text-center">
            <p className="text-dark-500">Pilih feedback untuk melihat detail</p>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Commit**

```bash
git add components/dashboard/FeedbackInbox.tsx
git commit -m "feat: add FeedbackInbox component"
```

---

### Task 7: Feedback Tabs (Client Component)

**Files:**
- Create: `components/dashboard/FeedbackTabs.tsx`

- [ ] **Create `components/dashboard/FeedbackTabs.tsx`**

```typescript
"use client";

import { useState } from "react";

interface FeedbackTabsProps {
  form: React.ReactNode;
  inbox: React.ReactNode;
  unreadCount: number;
}

export default function FeedbackTabs({ form, inbox, unreadCount }: FeedbackTabsProps) {
  const [active, setActive] = useState<"form" | "inbox">("form");

  const tabs = [
    { key: "form" as const, label: "Kirim Feedback" },
    { key: "inbox" as const, label: "Inbox", count: unreadCount },
  ];

  return (
    <div>
      <div className="flex gap-1 mb-6 p-1 bg-dark-800/50 rounded-xl border border-dark-700/30 w-fit">
        {tabs.map((tab) => (
          <button key={tab.key} type="button" onClick={() => setActive(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              active === tab.key ? "bg-barber-400/10 text-barber-400" : "text-dark-400 hover:text-dark-200"
            }`}>
            {tab.label}
            {tab.count > 0 && (
              <span className="w-5 h-5 rounded-full bg-barber-400/20 text-barber-400 text-xs flex items-center justify-center">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>
      {active === "form" ? form : inbox}
    </div>
  );
}
```

- [ ] **Commit**

```bash
git add components/dashboard/FeedbackTabs.tsx
git commit -m "feat: add FeedbackTabs client component"
```

---

### Task 8: Feedback Page (Server Component)

**Files:**
- Create: `app/dashboard/feedback/page.tsx`

- [ ] **Create `app/dashboard/feedback/page.tsx`**

```typescript
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import FeedbackForm from "@/components/dashboard/FeedbackForm";
import FeedbackInbox from "@/components/dashboard/FeedbackInbox";
import FeedbackTabs from "@/components/dashboard/FeedbackTabs";

export const dynamic = "force-dynamic";

export default async function FeedbackPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: barbershop } = await supabase
    .from("barbershops")
    .select("id, name")
    .eq("owner_id", user.id)
    .single();

  if (!barbershop) redirect("/onboarding");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("id", user.id)
    .single();

  const { data: feedbackList } = await supabase
    .from("feedback")
    .select("*")
    .eq("barbershop_id", barbershop.id)
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-white mb-1">Kritik & Saran</h1>
        <p className="text-dark-400 text-sm">Kirim masukan atau lihat feedback yang masuk</p>
      </div>

      <FeedbackTabs
        form={
          <FeedbackForm
            barbershopId={barbershop.id}
            profileId={profile?.id ?? null}
            profileName={profile?.full_name ?? null}
          />
        }
        inbox={<FeedbackInbox initialData={feedbackList ?? []} />}
        unreadCount={feedbackList?.filter((f) => !f.is_read).length ?? 0}
      />
    </div>
  );
}
```

- [ ] **Commit**

```bash
git add app/dashboard/feedback/page.tsx
git commit -m "feat: add feedback page route"
```

---

### Task 9: Update Sidebar Navigation

**Files:**
- Modify: `components/dashboard/Sidebar.tsx`

- [ ] **Add "Kritik & Saran" nav item**

Insert after the `Layanan` item and before `Analitik`:

```typescript
  {
    href: "/dashboard/feedback",
    label: "Kritik & Saran",
    icon: "M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0A2.701 2.701 0 003 15.546V4a1 1 0 011-1h16a1 1 0 011 1v11.546z",
  },
```

This uses a chat/message-square icon SVG path.

- [ ] **Commit**

```bash
git add components/dashboard/Sidebar.tsx
git commit -m "feat: add Kritik & Saran navigation item"
```

---

### Task 10: Environment Variables & Build Check

**Files:**
- Create/Modify: `.env.example`

- [ ] **Ensure env vars are documented**

If `.env.example` exists, append:
```
# Telegram Bot (for feedback notifications)
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
```

- [ ] **Run build check**

```bash
npm run build
```

Fix any TypeScript or build errors.

- [ ] **Commit**

```bash
git add .env.example
git commit -m "chore: add Telegram env vars to example"
```

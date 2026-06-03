# Telegram Admin Mini App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Telegram Mini App inside kapster providing superadmin access to KPIs, barbershop/user management, system health, VPS terminal, SQL query runner, SEO audit, and file manager.

**Architecture:** Modular page-based Next.js routes under `app/admin/`, sharing a common layout with Telegram WebApp SDK init and superadmin auth gate. Each feature is an independent route. Backend uses existing Supabase admin client + new API routes for terminal and file operations.

**Tech Stack:** Next.js 16 App Router, Tailwind CSS v4, `@telegram-apps/sdk`, `xterm` + `xterm-addon-fit`, `ssh2` (for terminal/files), Supabase admin client

---

### Task 1: Database Migration & Environment Setup

**Files:**
- Create: `supabase/migrations/20260603000004_add_admin_telegram_id.sql`
- Modify: `.env.local`

- [ ] **Step 1: Write migration**

```sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS telegram_id text UNIQUE;
```

- [ ] **Step 2: Add exec_sql RPC function (for SQL runner)**

```sql
CREATE OR REPLACE FUNCTION exec_sql(query_text text)
RETURNS SETOF json AS $$
BEGIN
  RETURN QUERY EXECUTE query_text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

- [ ] **Step 3: Add env vars**

Add to `.env.local`:
```
ADMIN_TELEGRAM_IDS=7764382006
SSH_HOST=localhost
SSH_PORT=22
SSH_USERNAME=root
SSH_PRIVATE_KEY_PATH=/root/.ssh/id_ed25519
```

---

### Task 2: Admin Auth Library & Telegram Verification

**Files:**
- Create: `lib/admin-auth.ts`

- [ ] **Step 1: Create admin-auth library**

```typescript
import { createAdminClient } from "@/lib/supabase/admin";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

const ADMIN_TELEGRAM_IDS = (process.env.ADMIN_TELEGRAM_IDS || "").split(",").map((s) => s.trim());

export async function verifySuperAdmin(userId: string): Promise<boolean> {
  const supabase = createAdminClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, telegram_id")
    .eq("id", userId)
    .single();
  return profile?.role === "superadmin";
}

export async function getSuperAdminFromTelegram(
  telegramId: string
): Promise<{ id: string; full_name: string | null } | null> {
  if (!ADMIN_TELEGRAM_IDS.includes(telegramId)) return null;
  const supabase = createAdminClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("telegram_id", telegramId)
    .single();
  return profile;
}

export function verifyTelegramInitData(initData: string): { telegram_id: string } | null {
  try {
    const params = new URLSearchParams(initData);
    const hash = params.get("hash");
    if (!hash) return null;
    const dataCheckString = Array.from(params.entries())
      .filter(([k]) => k !== "hash")
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join("\n");
    const secretKey = crypto.subtle
      ? new TextEncoder().encode(process.env.TELEGRAM_BOT_TOKEN)
      : null;
    if (!secretKey) return null;

    const userStr = params.get("user");
    if (!userStr) return null;
    const user = JSON.parse(userStr);
    return { telegram_id: String(user.id) };
  } catch {
    return null;
  }
}

// For cookie-based auth fallback
export async function getSuperAdminSession() {
  const supabase = createAdminClient();
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("admin_session");
  if (!sessionCookie) return null;
  const userId = sessionCookie.value;
  const isAdmin = await verifySuperAdmin(userId);
  if (!isAdmin) return null;
  return { id: userId };
}

export async function setSuperAdminSession(userId: string) {
  const cookieStore = await cookies();
  cookieStore.set("admin_session", userId, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24, // 24 hours
  });
}
```

---

### Task 3: Admin Layout with Telegram WebApp Init

**Files:**
- Create: `app/admin/layout.tsx`
- Create: `components/admin/Sidebar.tsx`
- Create: `components/admin/Header.tsx`

- [ ] **Step 1: Create AdminLayout with auth gate**

```typescript
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { verifySuperAdmin } from "@/lib/admin-auth";
import AdminLayoutClient from "@/components/admin/LayoutClient";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    // Try cookie-based session
    redirect("/auth/login");
  }

  const isSuperAdmin = await verifySuperAdmin(user.id);
  if (!isSuperAdmin) {
    return (
      <div className="h-screen bg-dark-950 flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <h1 className="font-display text-2xl font-bold text-white mb-2">Akses Ditolak</h1>
          <p className="text-dark-400">Hanya superadmin yang bisa mengakses halaman ini.</p>
        </div>
      </div>
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  return (
    <AdminLayoutClient
      user={{ email: user.email ?? "", full_name: profile?.full_name ?? null }}
    >
      {children}
    </AdminLayoutClient>
  );
}
```

- [ ] **Step 2: Create LayoutClient component**

```typescript
"use client";

import { useState } from "react";
import AdminSidebar from "@/components/admin/Sidebar";
import AdminHeader from "@/components/admin/Header";

export default function AdminLayoutClient({
  children,
  user,
}: {
  children: React.ReactNode;
  user: { email: string; full_name: string | null };
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="h-screen bg-dark-950 flex">
      <AdminSidebar
        mobileOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader
          user={user}
          onMenuToggle={() => setMobileMenuOpen((v) => !v)}
        />
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create AdminSidebar**

```typescript
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "@/components/Logo";

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
  { href: "/admin/barbershops", label: "Barbershops", icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" },
  { href: "/admin/users", label: "Users", icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" },
  { href: "/admin/system", label: "System", icon: "M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" },
  { href: "/admin/sql", label: "SQL Query", icon: "M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" },
  { href: "/admin/terminal", label: "Terminal", icon: "M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
  { href: "/admin/files", label: "Files", icon: "M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" },
  { href: "/admin/seo", label: "SEO Audit", icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" },
];

export default function AdminSidebar({
  mobileOpen,
  onClose,
}: {
  mobileOpen?: boolean;
  onClose?: () => void;
}) {
  const pathname = usePathname();

  const navContent = (
    <>
      <div className="px-6 py-5 border-b border-dark-800/50">
        <Link href="/admin/dashboard" className="flex items-center gap-3" onClick={onClose}>
          <div className="w-8 h-8 rounded-lg gold-gradient flex items-center justify-center">
            <Logo className="w-5 h-5 text-dark-900" />
          </div>
          <span className="font-display text-lg font-bold text-white">Admin</span>
        </Link>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                isActive
                  ? "bg-barber-400/10 text-barber-400 border border-barber-400/20"
                  : "text-dark-400 hover:text-white hover:bg-dark-800/50"
              }`}
            >
              <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
              </svg>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-dark-800/50">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-dark-400 hover:text-white hover:bg-dark-800/50 transition-all"
        >
          <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Kembali ke Dashboard
        </Link>
      </div>
    </>
  );

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />
      )}
      <aside className={`fixed left-0 top-0 h-full w-64 bg-dark-900 border-r border-dark-800/50 flex flex-col z-50 transform transition-transform duration-200 lg:hidden ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
        {navContent}
      </aside>
      <aside className="w-64 shrink-0 bg-dark-900 border-r border-dark-800/50 flex flex-col hidden lg:flex">
        {navContent}
      </aside>
    </>
  );
}
```

- [ ] **Step 4: Create AdminHeader**

```typescript
"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AdminHeader({
  user,
  onMenuToggle,
}: {
  user: { email: string; full_name: string | null };
  onMenuToggle?: () => void;
}) {
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  const initials = user.full_name
    ? user.full_name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : user.email[0].toUpperCase();

  return (
    <header className="h-14 border-b border-dark-800/50 bg-dark-900/50 backdrop-blur-sm flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center gap-3">
        <button onClick={onMenuToggle} className="lg:hidden text-dark-300 hover:text-white p-2 -ml-2" aria-label="Toggle menu">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div className="lg:hidden">
          <span className="font-display text-lg font-bold text-white">Admin</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="text-right hidden sm:block">
          <p className="text-white text-sm font-medium leading-none">{user.full_name ?? user.email}</p>
          <p className="text-dark-500 text-xs mt-0.5">{user.email}</p>
        </div>
        <div className="w-8 h-8 rounded-full gold-gradient flex items-center justify-center text-dark-900 text-sm font-bold">{initials}</div>
        <button onClick={handleSignOut} className="p-2 rounded-lg text-dark-400 hover:text-white hover:bg-dark-800 transition-colors" title="Keluar">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>
    </header>
  );
}
```

---

### Task 4: Dashboard Landing Page (redirect)

**Files:**
- Create: `app/admin/page.tsx`

- [ ] **Step 1: Create redirect page**

```typescript
import { redirect } from "next/navigation";

export default function AdminPage() {
  redirect("/admin/dashboard");
}
```

---

### Task 5: Dashboard KPIs Page

**Files:**
- Create: `app/admin/dashboard/page.tsx`

- [ ] **Step 1: Create dashboard page**

```typescript
import { createAdminClient } from "@/lib/supabase/admin";

function StatCard({ label, value, sub, accent }: { label: string; value: string | number; sub?: string; accent?: boolean }) {
  return (
    <div className={`p-6 rounded-2xl border ${accent ? "bg-barber-400/10 border-barber-400/30" : "bg-dark-800/50 border-dark-700/30"}`}>
      <p className="text-dark-400 text-sm mb-1">{label}</p>
      <p className={`font-display text-3xl font-bold ${accent ? "text-barber-400" : "text-white"}`}>{value}</p>
      {sub && <p className="text-dark-500 text-xs mt-1">{sub}</p>}
    </div>
  );
}

export default async function AdminDashboardPage() {
  const supabase = createAdminClient();

  const [
    { count: totalShops },
    { count: totalCustomers },
    { count: activeSubs },
    { data: pendingBookings },
    { data: monthlyRevenue },
  ] = await Promise.all([
    supabase.from("barbershops").select("*", { count: "exact", head: true }),
    supabase.from("queue_entries").select("*", { count: "exact", head: true }).eq("status", "done"),
    supabase.from("subscriptions").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("bookings").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("payments").select("amount").eq("status", "completed").gte("created_at", new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString()),
  ]);

  const totalRevenue = monthlyRevenue?.reduce((sum: number, p: { amount: number }) => sum + p.amount, 0) ?? 0;

  const today = new Date().toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-white mb-1">Admin Dashboard</h1>
        <p className="text-dark-400 text-sm">{today}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Barbershops" value={totalShops ?? 0} accent />
        <StatCard label="Pelanggan Selesai" value={totalCustomers ?? 0} sub="semua waktu" />
        <StatCard label="Subscriber Aktif" value={activeSubs ?? 0} sub={`dari ${totalShops ?? 0} barbershop`} />
        <StatCard label="Revenue Bulan Ini" value={`Rp ${totalRevenue.toLocaleString("id-ID")}`} sub="dari payment completed" accent />
        <StatCard label="Booking Pending" value={pendingBookings?.length ?? 0} sub="perlu dikonfirmasi" />
      </div>

      <div className="bg-dark-800/50 border border-dark-700/30 rounded-2xl p-6">
        <h2 className="font-semibold text-white mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <a href="/admin/seo" className="px-4 py-2 rounded-xl bg-dark-700/50 text-dark-200 text-sm hover:bg-barber-400/10 hover:text-barber-400 transition-all">
            Trigger SEO Audit
          </a>
          <a href="/admin/sql" className="px-4 py-2 rounded-xl bg-dark-700/50 text-dark-200 text-sm hover:bg-barber-400/10 hover:text-barber-400 transition-all">
            SQL Query
          </a>
          <a href="/admin/system" className="px-4 py-2 rounded-xl bg-dark-700/50 text-dark-200 text-sm hover:bg-barber-400/10 hover:text-barber-400 transition-all">
            System Health
          </a>
        </div>
      </div>
    </div>
  );
}
```

---

### Task 6: Barbershop Management Page

**Files:**
- Create: `app/admin/barbershops/page.tsx`
- Create: `app/admin/barbershops/[id]/page.tsx`
- Create: `app/admin/barbershops/actions.ts`

- [ ] **Step 1: Create barbershop list page**

```typescript
import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";

export default async function AdminBarbershopsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; city?: string; status?: string }>;
}) {
  const supabase = createAdminClient();
  const params = await searchParams;

  let query = supabase
    .from("barbershops")
    .select("id, name, slug, city, owner_id, created_at, profiles!barbershops_owner_id_fkey(full_name, phone)");

  if (params.q) query = query.ilike("name", `%${params.q}%`);
  if (params.city) query = query.eq("city", params.city);

  const { data: barbershops } = await query.order("created_at", { ascending: false }).limit(50);

  // Get subscription status for each
  const { data: subscriptions } = await supabase
    .from("subscriptions")
    .select("barbershop_id, status");

  const subMap = new Map(subscriptions?.map((s) => [s.barbershop_id, s.status]) ?? []);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-white">Barbershops</h1>
      </div>

      <form className="flex gap-3">
        <input
          name="q"
          defaultValue={params.q}
          placeholder="Cari barbershop..."
          className="flex-1 px-4 py-2 rounded-xl bg-dark-800 border border-dark-700 text-white placeholder:text-dark-500 text-sm focus:outline-none focus:border-barber-400/50"
        />
        <button type="submit" className="px-4 py-2 rounded-xl bg-barber-400/10 text-barber-400 border border-barber-400/20 text-sm hover:bg-barber-400/20 transition-all">
          Cari
        </button>
      </form>

      <div className="bg-dark-800/50 border border-dark-700/30 rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-dark-700/30 text-left text-dark-400 text-sm">
              <th className="p-4 font-medium">Nama</th>
              <th className="p-4 font-medium">Pemilik</th>
              <th className="p-4 font-medium">Kota</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium">Dibuat</th>
              <th className="p-4 font-medium" />
            </tr>
          </thead>
          <tbody>
            {barbershops?.map((bs) => {
              const subStatus = subMap.get(bs.id);
              return (
                <tr key={bs.id} className="border-b border-dark-700/20 hover:bg-dark-700/20 transition-colors">
                  <td className="p-4 text-white font-medium">{bs.name}</td>
                  <td className="p-4 text-dark-300">{(bs.profiles as { full_name: string | null; phone: string | null } | null)?.full_name ?? "-"}</td>
                  <td className="p-4 text-dark-300">{bs.city ?? "-"}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                      subStatus === "active" ? "bg-green-500/10 text-green-400" : "bg-dark-700/50 text-dark-400"
                    }`}>
                      {subStatus === "active" ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="p-4 text-dark-400 text-sm">{new Date(bs.created_at).toLocaleDateString("id-ID")}</td>
                  <td className="p-4">
                    <Link href={`/admin/barbershops/${bs.id}`} className="text-barber-400 text-sm hover:underline">
                      Detail
                    </Link>
                  </td>
                </tr>
              );
            })}
            {(!barbershops || barbershops.length === 0) && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-dark-500">Tidak ada barbershop ditemukan</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create barbershop detail page**

```typescript
import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";

export default async function AdminBarbershopDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { data: barbershop } = await supabase
    .from("barbershops")
    .select("*, profiles!barbershops_owner_id_fkey(full_name, phone, email)")
    .eq("id", id)
    .single();

  if (!barbershop) notFound();

  const { count: barberCount } = await supabase
    .from("barbers")
    .select("*", { count: "exact", head: true })
    .eq("barbershop_id", id);

  const { count: totalCustomers } = await supabase
    .from("queue_entries")
    .select("*", { count: "exact", head: true })
    .eq("barbershop_id", id)
    .eq("status", "done");

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("barbershop_id", id)
    .maybeSingle();

  const profile = barbershop.profiles as { full_name: string | null; phone: string | null; email: string | null } | null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="font-display text-2xl font-bold text-white">{barbershop.name}</h1>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-dark-800/50 border border-dark-700/30">
          <p className="text-dark-400 text-xs mb-1">Barber</p>
          <p className="text-white font-display text-2xl font-bold">{barberCount ?? 0}</p>
        </div>
        <div className="p-4 rounded-2xl bg-dark-800/50 border border-dark-700/30">
          <p className="text-dark-400 text-xs mb-1">Pelanggan Selesai</p>
          <p className="text-white font-display text-2xl font-bold">{totalCustomers ?? 0}</p>
        </div>
        <div className="p-4 rounded-2xl bg-dark-800/50 border border-dark-700/30">
          <p className="text-dark-400 text-xs mb-1">Subscription</p>
          <p className={`font-display text-2xl font-bold ${subscription?.status === "active" ? "text-green-400" : "text-dark-400"}`}>
            {subscription?.status ?? "none"}
          </p>
        </div>
      </div>

      <div className="bg-dark-800/50 border border-dark-700/30 rounded-2xl p-6 space-y-4">
        <h2 className="font-semibold text-white">Informasi</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><span className="text-dark-400">Pemilik:</span> <span className="text-white ml-2">{profile?.full_name ?? "-"}</span></div>
          <div><span className="text-dark-400">Telepon:</span> <span className="text-white ml-2">{barbershop.phone ?? "-"}</span></div>
          <div><span className="text-dark-400">Email:</span> <span className="text-white ml-2">{profile?.email ?? "-"}</span></div>
          <div><span className="text-dark-400">Kota:</span> <span className="text-white ml-2">{barbershop.city ?? "-"}</span></div>
          <div><span className="text-dark-400">Slug:</span> <span className="text-white ml-2">{barbershop.slug}</span></div>
          <div><span className="text-dark-400">WhatsApp:</span> <span className={`ml-2 ${barbershop.wa_connected ? "text-green-400" : "text-dark-400"}`}>
            {barbershop.wa_connected ? "Terhubung" : "Tidak terhubung"}
          </span></div>
        </div>
      </div>
    </div>
  );
}
```

---

### Task 7: User Management Page

**Files:**
- Create: `app/admin/users/page.tsx`

- [ ] **Step 1: Create users page**

```typescript
import { createAdminClient } from "@/lib/supabase/admin";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; q?: string }>;
}) {
  const supabase = createAdminClient();
  const params = await searchParams;

  let query = supabase
    .from("profiles")
    .select("id, full_name, phone, role, phone_verified_at, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  if (params.role) query = query.eq("role", params.role);
  if (params.q) query = query.ilike("full_name", `%${params.q}%`);

  const { data: users } = await query;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <h1 className="font-display text-2xl font-bold text-white">Users</h1>

      <div className="flex gap-3">
        <form className="flex-1 flex gap-3">
          <input name="q" defaultValue={params.q} placeholder="Cari user..." className="flex-1 px-4 py-2 rounded-xl bg-dark-800 border border-dark-700 text-white placeholder:text-dark-500 text-sm focus:outline-none focus:border-barber-400/50" />
          <select name="role" defaultValue={params.role ?? ""} className="px-4 py-2 rounded-xl bg-dark-800 border border-dark-700 text-dark-200 text-sm focus:outline-none focus:border-barber-400/50">
            <option value="">Semua Role</option>
            <option value="owner">Owner</option>
            <option value="barber">Barber</option>
            <option value="customer">Customer</option>
            <option value="superadmin">Superadmin</option>
          </select>
          <button type="submit" className="px-4 py-2 rounded-xl bg-barber-400/10 text-barber-400 border border-barber-400/20 text-sm hover:bg-barber-400/20 transition-all">Filter</button>
        </form>
      </div>

      <div className="bg-dark-800/50 border border-dark-700/30 rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-dark-700/30 text-left text-dark-400 text-sm">
              <th className="p-4 font-medium">Nama</th>
              <th className="p-4 font-medium">Telepon</th>
              <th className="p-4 font-medium">Role</th>
              <th className="p-4 font-medium">Verified</th>
              <th className="p-4 font-medium">Dibuat</th>
            </tr>
          </thead>
          <tbody>
            {users?.map((u) => (
              <tr key={u.id} className="border-b border-dark-700/20 hover:bg-dark-700/20 transition-colors">
                <td className="p-4 text-white font-medium">{u.full_name ?? "-"}</td>
                <td className="p-4 text-dark-300">{u.phone ?? "-"}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                    u.role === "superadmin" ? "bg-barber-400/10 text-barber-400" :
                    u.role === "owner" ? "bg-blue-500/10 text-blue-400" :
                    "bg-dark-700/50 text-dark-300"
                  }`}>
                    {u.role}
                  </span>
                </td>
                <td className="p-4">
                  {u.phone_verified_at ? (
                    <span className="text-green-400 text-sm">✓</span>
                  ) : (
                    <span className="text-dark-500 text-sm">-</span>
                  )}
                </td>
                <td className="p-4 text-dark-400 text-sm">
                  {new Date(u.created_at).toLocaleDateString("id-ID")}
                </td>
              </tr>
            ))}
            {(!users || users.length === 0) && (
              <tr><td colSpan={5} className="p-8 text-center text-dark-500">Tidak ada user ditemukan</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

---

### Task 8: SQL Query Runner

**Files:**
- Create: `app/admin/sql/page.tsx`
- Create: `app/admin/api/sql/execute/route.ts`

- [ ] **Step 1: Create SQL execution API route**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const BLOCKED_COMMANDS = /^\s*(DROP|TRUNCATE|ALTER|CREATE|GRANT|REVOKE)\b/i;

export async function POST(request: NextRequest) {
  try {
    const { query, allowWrite } = await request.json();

    if (!query || typeof query !== "string") {
      return NextResponse.json({ error: "Query diperlukan" }, { status: 400 });
    }

    if (BLOCKED_COMMANDS.test(query)) {
      return NextResponse.json({ error: "DDL tidak diizinkan (DROP/TRUNCATE/ALTER/CREATE/GRANT/REVOKE)" }, { status: 403 });
    }

    const trimmedQuery = query.trim().toUpperCase();
    const isWrite = trimmedQuery.startsWith("INSERT") || trimmedQuery.startsWith("UPDATE") || trimmedQuery.startsWith("DELETE");

    if (isWrite && !allowWrite) {
      return NextResponse.json({ error: "Mode read-only. Aktifkan toggle write untuk INSERT/UPDATE/DELETE." }, { status: 403 });
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase.rpc("exec_sql", { query_text: query });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ data, isWrite });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
```

- [ ] **Step 2: Create SQL runner page**

```typescript
"use client";

import { useState, useRef } from "react";

const TEMPLATES = [
  { label: "Semua Barbershop", query: "SELECT id, name, slug, city, created_at FROM barbershops ORDER BY created_at DESC LIMIT 20;" },
  { label: "Subscriber Aktif", query: "SELECT bs.name, bs.city, s.current_period_end FROM subscriptions s JOIN barbershops bs ON bs.id = s.barbershop_id WHERE s.status = 'active' ORDER BY s.current_period_end DESC;" },
  { label: "Revenue Bulan Ini", query: "SELECT DATE_TRUNC('day', created_at) as day, SUM(amount) as total FROM payments WHERE status = 'completed' AND created_at >= DATE_TRUNC('month', NOW()) GROUP BY 1 ORDER BY 1;" },
  { label: "Top Barbershops by Customers", query: "SELECT bs.name, COUNT(qe.id) as total_customers FROM barbershops bs JOIN queue_entries qe ON qe.barbershop_id = bs.id WHERE qe.status = 'done' GROUP BY bs.id, bs.name ORDER BY total_customers DESC LIMIT 10;" },
  { label: "WhatsApp Pending", query: "SELECT COUNT(*) as pending FROM wa_notifications WHERE status = 'pending';" },
  { label: "Cek Subscription Expired", query: "SELECT bs.name, bs.owner_id, s.current_period_end FROM barbershops bs JOIN subscriptions s ON s.barbershop_id = bs.id WHERE s.status = 'active' AND s.current_period_end < NOW();" },
];

export default function AdminSqlPage() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<{ data: unknown[]; error?: string; isWrite?: boolean } | null>(null);
  const [loading, setLoading] = useState(false);
  const [allowWrite, setAllowWrite] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const execute = async (q: string) => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/admin/api/sql/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q, allowWrite }),
      });
      const json = await res.json();
      setResult(json);
      if (!json.error) {
        setHistory((prev) => [q, ...prev].slice(0, 20));
      }
    } catch (err) {
      setResult({ data: [], error: String(err) });
    }
    setLoading(false);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-white">SQL Query</h1>
        <label className="flex items-center gap-2 text-sm text-dark-400 cursor-pointer">
          <input type="checkbox" checked={allowWrite} onChange={(e) => setAllowWrite(e.target.checked)} className="rounded border-dark-600 bg-dark-700" />
          Izinkan INSERT/UPDATE/DELETE
        </label>
      </div>

      <div className="flex flex-wrap gap-2">
        {TEMPLATES.map((t) => (
          <button key={t.label} onClick={() => { setQuery(t.query); textareaRef.current?.focus(); }}
            className="px-3 py-1.5 rounded-lg bg-dark-800 border border-dark-700 text-dark-300 text-xs hover:border-barber-400/30 hover:text-barber-400 transition-all"
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        <textarea ref={textareaRef} value={query} onChange={(e) => setQuery(e.target.value)}
          placeholder="Masukkan SQL query..."
          className="w-full h-32 px-4 py-3 rounded-2xl bg-dark-800 border border-dark-700 text-white placeholder:text-dark-500 text-sm font-mono focus:outline-none focus:border-barber-400/50 resize-y"
        />
        <div className="flex gap-3">
          <button onClick={() => execute(query)} disabled={loading || !query.trim()}
            className="px-6 py-2 rounded-xl bg-barber-400/10 text-barber-400 border border-barber-400/20 text-sm hover:bg-barber-400/20 transition-all disabled:opacity-50"
          >
            {loading ? "Running..." : "▶ Execute"}
          </button>
          <button onClick={() => execute("EXPLAIN ANALYZE " + query)} disabled={loading || !query.trim()}
            className="px-4 py-2 rounded-xl bg-dark-800 text-dark-300 border border-dark-700 text-sm hover:text-white transition-all disabled:opacity-50"
          >
            EXPLAIN
          </button>
          <button onClick={() => setQuery("")} className="px-4 py-2 rounded-xl bg-dark-800 text-dark-400 border border-dark-700 text-sm hover:text-white transition-all">
            Clear
          </button>
        </div>
      </div>

      {result && (
        <div className="bg-dark-800/50 border border-dark-700/30 rounded-2xl overflow-hidden">
          {result.error ? (
            <div className="p-4 text-red-400 text-sm font-mono">{result.error}</div>
          ) : (
            <div className="overflow-x-auto">
              {Array.isArray(result.data) && result.data.length > 0 ? (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-dark-700/30 text-left text-dark-400 text-sm">
                      {Object.keys(result.data[0]).map((key) => (
                        <th key={key} className="p-3 font-medium whitespace-nowrap">{key}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result.data.map((row, i) => (
                      <tr key={i} className="border-b border-dark-700/20 hover:bg-dark-700/20">
                        {Object.values(row as Record<string, unknown>).map((val, j) => (
                          <td key={j} className="p-3 text-dark-200 text-sm font-mono whitespace-nowrap">{String(val ?? "NULL")}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-4 text-dark-400 text-sm">{result.isWrite ? "✅ Query berhasil dieksekusi" : "✅ Query selesai (0 rows)"}</div>
              )}
            </div>
          )}
        </div>
      )}

      {history.length > 0 && (
        <div className="bg-dark-800/50 border border-dark-700/30 rounded-2xl p-4">
          <h3 className="text-dark-400 text-sm font-medium mb-2">Riwayat</h3>
          <div className="space-y-1">
            {history.map((h, i) => (
              <button key={i} onClick={() => setQuery(h)}
                className="block w-full text-left px-3 py-1.5 rounded-lg text-dark-400 text-xs font-mono hover:bg-dark-700/50 hover:text-dark-200 transition-all truncate"
              >
                {h}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

---

### Task 9: System Health Page

**Files:**
- Create: `app/admin/system/page.tsx`
- Create: `app/admin/api/system/metrics/route.ts`

- [ ] **Step 1: Create system metrics API route**

```typescript
import { NextResponse } from "next/server";
import { execSync } from "child_process";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const uptime = execSync("uptime -p").toString().trim();
    const cpuInfo = execSync("top -bn1 | grep 'Cpu(s)' | awk '{print $2}'").toString().trim();
    const memInfo = execSync("free -m | awk 'NR==2{printf \"%s/%sMB (%.1f%%)\", $3, $2, $3*100/$2}'").toString().trim();
    const diskInfo = execSync("df -h / | awk 'NR==2{printf \"%s/%s (%s)\", $3, $2, $5}'").toString().trim();

    let dbConnections = 0;
    try {
      const dbRes = await createAdminClient().rpc("exec_sql", { query_text: "SELECT count(*) as cnt FROM pg_stat_activity" });
      dbConnections = (dbRes.data as unknown as { cnt: number }[])?.[0]?.cnt ?? 0;
    } catch { /* pg_stat_activity may not be accessible */ }

    // cron job status from existing scripts
    const blogCron = execSync("grep 'generate-blog' /var/log/cron.log 2>/dev/null || echo 'no log'").toString().trim();
    const seoCron = execSync("grep 'seo-audit' /var/log/cron.log 2>/dev/null || echo 'no log'").toString().trim();

    return NextResponse.json({
      server: { uptime, cpu: cpuInfo || "N/A", memory: memInfo, disk: diskInfo },
      database: { connections: dbConnections ?? 0 },
      cron: {
        blog: blogCron.slice(-100),
        seo: seoCron.slice(-100),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json({ error: String(err), timestamp: new Date().toISOString() }, { status: 500 });
  }
}
```

- [ ] **Step 2: Create system health page**

```typescript
export const dynamic = "force-dynamic";

import { createAdminClient } from "@/lib/supabase/admin";

async function getMetrics() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/admin/api/system/metrics`, { cache: "no-store" });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export default async function AdminSystemPage() {
  const supabase = createAdminClient();
  const metrics = await getMetrics();

  const { count: waPending } = await supabase
    .from("wa_notifications")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending");

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-white">System Health</h1>
        <span className="text-dark-500 text-xs">{metrics?.timestamp ? new Date(metrics.timestamp).toLocaleString("id-ID") : ""}</span>
      </div>

      {metrics ? (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-dark-800/50 border border-dark-700/30">
              <p className="text-dark-400 text-xs mb-1">CPU</p>
              <p className="text-white font-display text-xl font-bold">{metrics.server.cpu}%</p>
            </div>
            <div className="p-4 rounded-2xl bg-dark-800/50 border border-dark-700/30">
              <p className="text-dark-400 text-xs mb-1">Memory</p>
              <p className="text-white font-mono text-sm">{metrics.server.memory}</p>
            </div>
            <div className="p-4 rounded-2xl bg-dark-800/50 border border-dark-700/30">
              <p className="text-dark-400 text-xs mb-1">Disk</p>
              <p className="text-white font-mono text-sm">{metrics.server.disk}</p>
            </div>
            <div className="p-4 rounded-2xl bg-dark-800/50 border border-dark-700/30">
              <p className="text-dark-400 text-xs mb-1">Uptime</p>
              <p className="text-white text-sm">{metrics.server.uptime}</p>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-dark-800/50 border border-dark-700/30 rounded-2xl p-6">
              <h2 className="font-semibold text-white mb-4">Database</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-dark-400">Koneksi Aktif</span>
                  <span className="text-white">{metrics.database.connections}</span>
                </div>
              </div>
            </div>

            <div className="bg-dark-800/50 border border-dark-700/30 rounded-2xl p-6">
              <h2 className="font-semibold text-white mb-4">WhatsApp Gateway</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-dark-400">Notifikasi Pending</span>
                  <span className={waPending && waPending > 10 ? "text-yellow-400" : "text-white"}>{waPending ?? 0}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-dark-800/50 border border-dark-700/30 rounded-2xl p-6">
            <h2 className="font-semibold text-white mb-4">Cron Jobs</h2>
            <div className="space-y-3">
              {[
                { label: "Blog Generator", log: metrics.cron.blog },
                { label: "SEO Audit", log: metrics.cron.seo },
              ].map((job) => (
                <div key={job.label} className="p-3 rounded-xl bg-dark-700/30">
                  <p className="text-white text-sm font-medium mb-1">{job.label}</p>
                  <p className="text-dark-500 text-xs font-mono truncate">{job.log || "Belum ada log"}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="bg-dark-800/50 border border-dark-700/30 rounded-2xl p-8 text-center text-dark-500">
          Tidak bisa mengambil metrics server (pastikan endpoint internal tersedia)
        </div>
      )}
    </div>
  );
}
```

---

### Task 10: VPS Terminal Page

**Files:**
- Create: `app/admin/terminal/page.tsx`
- Create: `app/admin/api/terminal/exec/route.ts`

- [ ] **Step 1: Create terminal exec API route**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { execSync } from "child_process";

export async function POST(request: NextRequest) {
  try {
    const { command } = await request.json();
    if (!command || typeof command !== "string") {
      return NextResponse.json({ error: "Command diperlukan" }, { status: 400 });
    }

    const MAX_OUTPUT = 50000;
    const output = execSync(command, {
      timeout: 30000,
      maxBuffer: MAX_OUTPUT,
      shell: "/bin/bash",
      encoding: "utf-8",
    });

    return NextResponse.json({
      output: output.slice(0, MAX_OUTPUT),
      exitCode: 0,
    });
  } catch (err: unknown) {
    const error = err as { stderr?: string; stdout?: string; status?: number; message?: string };
    return NextResponse.json({
      output: (error.stderr || error.stdout || error.message || String(err)).slice(0, 50000),
      exitCode: error.status ?? 1,
    });
  }
}
```

- [ ] **Step 2: Create terminal page**

```typescript
"use client";

import { useState, useRef, useEffect } from "react";

export default function AdminTerminalPage() {
  const [commands, setCommands] = useState<{ input: string; output: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [cwd, setCwd] = useState("~");
  const outputRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    outputRef.current?.scrollTo(0, outputRef.current.scrollHeight);
  }, [commands]);

  const execute = async (cmd: string) => {
    if (!cmd.trim()) return;
    setLoading(true);
    setCommands((prev) => [...prev, { input: cmd, output: "" }]);
    try {
      const res = await fetch("/admin/api/terminal/exec", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: cmd }),
      });
      const json = await res.json();
      setCommands((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = { input: cmd, output: json.output || json.error || "" };
        return updated;
      });
    } catch (err) {
      setCommands((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = { input: cmd, output: String(err) };
        return updated;
      });
    }
    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !loading) {
      execute(input);
      setInput("");
    }
  };

  const clearTerminal = () => setCommands([]);

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-white">Terminal</h1>
        <button onClick={clearTerminal} className="px-3 py-1.5 rounded-lg bg-dark-800 text-dark-400 border border-dark-700 text-sm hover:text-white transition-all">
          Clear
        </button>
      </div>

      <div className="bg-dark-900 border border-dark-700/50 rounded-2xl overflow-hidden">
        <div className="px-4 py-2 bg-dark-800/50 border-b border-dark-700/30 flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500/50" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
          <div className="w-3 h-3 rounded-full bg-green-500/50" />
          <span className="text-dark-500 text-xs ml-2 font-mono">admin@kapster:{cwd}</span>
        </div>

        <div ref={outputRef} className="p-4 h-96 overflow-y-auto font-mono text-sm space-y-2" onClick={() => inputRef.current?.focus()}>
          {commands.length === 0 && (
            <div className="text-dark-500">
              <p className="mb-2">🚀 Kapster Admin Terminal</p>
              <p className="text-xs">Ketik command untuk menjalankan perintah di server.</p>
              <p className="text-xs mt-1">Contoh: <span className="text-barber-400">ls -la</span>, <span className="text-barber-400">df -h</span>, <span className="text-barber-400">pm2 status</span>, <span className="text-barber-400">docker ps</span></p>
            </div>
          )}
          {commands.map((cmd, i) => (
            <div key={i}>
              <div>
                <span className="text-green-400">$ </span>
                <span className="text-white">{cmd.input}</span>
              </div>
              <div className="text-dark-300 whitespace-pre-wrap">{cmd.output}</div>
            </div>
          ))}
          {loading && <div className="text-dark-500 animate-pulse">▍</div>}
        </div>

        <div className="px-4 py-3 border-t border-dark-700/30 flex items-center gap-2">
          <span className="text-green-400 font-mono text-sm">$</span>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            placeholder="Masukkan command..."
            className="flex-1 bg-transparent text-white font-mono text-sm outline-none placeholder:text-dark-600"
            autoFocus
          />
        </div>
      </div>

      <div className="text-dark-500 text-xs">
        ⚠️ Command dijalankan di server. Hati-hati dengan perintah destruktif.
      </div>
    </div>
  );
}
```

---

### Task 11: File Manager

**Files:**
- Create: `app/admin/files/page.tsx`
- Create: `app/admin/api/files/list/route.ts`
- Create: `app/admin/api/files/read/route.ts`
- Create: `app/admin/api/files/write/route.ts`

- [ ] **Step 1: Create file list API route**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { execSync } from "child_process";

const ALLOWED_BASE = process.cwd();

export async function GET(request: NextRequest) {
  const path = request.nextUrl.searchParams.get("path") || ".";
  const fullPath = path.startsWith("/") ? path : `${ALLOWED_BASE}/${path.replace(/^\.\//, "")}`;

  try {
    const output = execSync(`ls -la --time-style=+"%Y-%m-%d %H:%M" "${fullPath}"`, { encoding: "utf-8" });
    const lines = output.trim().split("\n").slice(1);
    const files = lines.map((line) => {
      const parts = line.split(/\s+/);
      const perms = parts[0];
      const isDir = perms.startsWith("d");
      const size = parts[4];
      const date = parts[5] + " " + parts[6];
      const name = parts.slice(7).join(" ");
      return { name, perms, size, date, isDir };
    });

    return NextResponse.json({ files, currentPath: fullPath.replace(ALLOWED_BASE, "") || "/" });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
```

- [ ] **Step 2: Create file read API route**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { readFileSync } from "fs";

export async function GET(request: NextRequest) {
  const filePath = request.nextUrl.searchParams.get("path") || "";
  try {
    const content = readFileSync(filePath, "utf-8");
    return NextResponse.json({ content, path: filePath });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
```

- [ ] **Step 3: Create file write API route**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { writeFileSync } from "fs";

export async function POST(request: NextRequest) {
  try {
    const { path: filePath, content } = await request.json();
    writeFileSync(filePath, content, "utf-8");
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
```

- [ ] **Step 4: Create file manager page**

```typescript
"use client";

import { useState, useEffect } from "react";

interface FileEntry {
  name: string;
  perms: string;
  size: string;
  date: string;
  isDir: boolean;
}

export default function AdminFilesPage() {
  const [currentPath, setCurrentPath] = useState(".");
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedFile, setSelectedFile] = useState<{ path: string; content: string } | null>(null);
  const [editContent, setEditContent] = useState("");

  const loadFiles = async (path: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/admin/api/files/list?path=${encodeURIComponent(path)}`);
      const json = await res.json();
      if (json.error) { setError(json.error); return; }
      setFiles(json.files);
      setCurrentPath(json.currentPath);
    } catch (err) {
      setError(String(err));
    }
    setLoading(false);
  };

  useEffect(() => { loadFiles("."); }, []);

  const readFile = async (name: string) => {
    const fullPath = `${process.cwd()}${currentPath === "/" ? "" : currentPath}/${name}`;
    const res = await fetch(`/admin/api/files/read?path=${encodeURIComponent(fullPath)}`);
    const json = await res.json();
    if (json.error) { alert(json.error); return; }
    setSelectedFile({ path: fullPath, content: json.content });
    setEditContent(json.content);
  };

  const saveFile = async () => {
    if (!selectedFile) return;
    const res = await fetch("/admin/api/files/write", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: selectedFile.path, content: editContent }),
    });
    const json = await res.json();
    if (json.success) {
      alert("File tersimpan!");
      setSelectedFile(null);
    } else {
      alert("Error: " + json.error);
    }
  };

  const navigateTo = (name: string) => {
    const newPath = currentPath === "/" ? `/${name}` : `${currentPath}/${name}`;
    loadFiles(newPath);
  };

  const goUp = () => {
    const parent = currentPath.split("/").slice(0, -1).join("/") || ".";
    loadFiles(parent);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-white">File Manager</h1>
      </div>

      <div className="bg-dark-800/50 border border-dark-700/30 rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-dark-700/30 flex items-center gap-2 text-sm">
          <button onClick={() => loadFiles(".")} className="text-dark-400 hover:text-white">📁 /kapster</button>
          {currentPath.split("/").filter(Boolean).map((part, i, arr) => (
            <span key={i} className="text-dark-600">
              /<button onClick={() => loadFiles("/" + arr.slice(0, i + 1).join("/"))}
                className="text-dark-400 hover:text-white ml-1">{part}</button>
            </span>
          ))}
          <button onClick={goUp} className="ml-auto text-dark-400 hover:text-white text-xs px-2 py-1 rounded bg-dark-700/50">
            ▲ Naik
          </button>
        </div>

        <div className="divide-y divide-dark-700/20">
          {loading ? (
            <div className="p-8 text-center text-dark-500">Loading...</div>
          ) : error ? (
            <div className="p-8 text-center text-red-400">{error}</div>
          ) : (
            files.map((file) => (
              <div key={file.name} className="flex items-center px-4 py-2.5 hover:bg-dark-700/20 transition-colors text-sm">
                <button
                  onClick={() => file.isDir ? navigateTo(file.name) : readFile(file.name)}
                  className="flex items-center gap-3 flex-1 text-left"
                >
                  <span className="text-lg">{file.isDir ? "📁" : "📄"}</span>
                  <span className="text-white">{file.name}</span>
                </button>
                <span className="text-dark-500 w-20 text-right">{file.size}</span>
                <span className="text-dark-500 w-36 text-right">{file.date}</span>
                <span className="text-dark-600 w-24 text-right font-mono text-xs">{file.perms}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {selectedFile && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-dark-900 border border-dark-700/50 rounded-2xl w-full max-w-4xl max-h-[80vh] flex flex-col">
            <div className="px-6 py-4 border-b border-dark-700/30 flex items-center justify-between">
              <h3 className="text-white font-medium truncate">{selectedFile.path}</h3>
              <button onClick={() => setSelectedFile(null)} className="text-dark-400 hover:text-white">✕</button>
            </div>
            <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)}
              className="flex-1 p-4 bg-dark-950 text-white font-mono text-sm outline-none resize-none"
              spellCheck={false}
            />
            <div className="px-6 py-4 border-t border-dark-700/30 flex justify-end gap-3">
              <button onClick={() => setSelectedFile(null)} className="px-4 py-2 rounded-xl bg-dark-800 text-dark-300 border border-dark-700 text-sm hover:text-white">
                Cancel
              </button>
              <button onClick={saveFile} className="px-4 py-2 rounded-xl bg-barber-400/10 text-barber-400 border border-barber-400/20 text-sm hover:bg-barber-400/20">
                💾 Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

---

### Task 12: SEO Audit Dashboard

**Files:**
- Create: `app/admin/seo/page.tsx`
- Create: `app/admin/seo/actions.ts`

- [ ] **Step 1: Create SEO audit actions**

```typescript
"use server";

import { spawn } from "child_process";
import path from "path";
import { revalidatePath } from "next/cache";

export async function triggerSeoAudit() {
  const scriptPath = path.join(process.cwd(), "scripts/seo-audit.ts");
  spawn("npx", ["tsx", scriptPath], {
    cwd: process.cwd(),
    stdio: "inherit",
    env: { ...process.env },
    shell: true,
  });
  revalidatePath("/admin/seo");
  return { success: true };
}
```

- [ ] **Step 2: Create SEO audit page**

```typescript
import { createAdminClient } from "@/lib/supabase/admin";
import { triggerSeoAudit } from "./actions";

export default async function AdminSeoPage() {
  const supabase = createAdminClient();

  const { data: metrics } = await supabase
    .from("content_metrics")
    .select("*")
    .order("metric_date", { ascending: false })
    .limit(20);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-white">SEO Audit</h1>
        <form action={triggerSeoAudit}>
          <button type="submit" className="px-4 py-2 rounded-xl bg-barber-400/10 text-barber-400 border border-barber-400/20 text-sm hover:bg-barber-400/20 transition-all">
            🔄 Trigger Audit
          </button>
        </form>
      </div>

      <div className="bg-dark-800/50 border border-dark-700/30 rounded-2xl p-6">
        <p className="text-dark-400 text-sm mb-2">Audit berjalan di background via cron. Trigger manual akan menjalankan script seo-audit.ts.</p>
        <p className="text-dark-500 text-xs">Cek hasil audit di tab cron atau log server.</p>
      </div>

      <div className="bg-dark-800/50 border border-dark-700/30 rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-dark-700/30 text-left text-dark-400 text-sm">
              <th className="p-4 font-medium">Metric</th>
              <th className="p-4 font-medium">Value</th>
              <th className="p-4 font-medium">Tanggal</th>
            </tr>
          </thead>
          <tbody>
            {metrics?.map((m) => (
              <tr key={m.id} className="border-b border-dark-700/20 hover:bg-dark-700/20 transition-colors">
                <td className="p-4 text-white">{m.metric_name}</td>
                <td className="p-4 text-dark-200">{m.metric_value}</td>
                <td className="p-4 text-dark-400 text-sm">{new Date(m.metric_date).toLocaleDateString("id-ID")}</td>
              </tr>
            ))}
            {(!metrics || metrics.length === 0) && (
              <tr><td colSpan={3} className="p-8 text-center text-dark-500">Belum ada data audit</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

---

### Task 13: Telegram Bot Integration — Admin Menu

**Files:**
- Modify: `app/api/telegram/webhook/route.ts`

- [ ] **Step 1: Add /admin command to Telegram webhook**

Add this handler inside the webhook POST function, after the existing `/konten` handler:

```typescript
// Handle /admin command — open mini app
if (body.message?.text === "/admin") {
  const chatId = body.message.chat.id;
  const adminIds = (process.env.ADMIN_TELEGRAM_IDS || "").split(",").map((s: string) => s.trim());
  const userId = body.message.from?.id?.toString();

  if (!userId || !adminIds.includes(userId)) {
    await sendTelegramMessage("⛔ Akses ditolak. Anda bukan admin.");
    return NextResponse.json({ ok: true });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://kapster.my.id";
  await sendTelegramMessage(
    "🔐 <b>Admin Panel</b>\n\nKlik tombol di bawah untuk membuka panel admin:",
    {
      inline_keyboard: [[
        { text: "🚀 Buka Admin Panel", url: `${appUrl}/admin` },
      ]],
    }
  );

  return NextResponse.json({ ok: true });
}
```

Also add a handler for bot start message with admin button.

---

### Task 14: Admin Redirect for Telegram Mini App Init

**Files:**
- Create: `app/admin/init/route.ts` — Optional init endpoint for Telegram data validation

- [ ] **Step 1: Quick init validation endpoint (optional)**

This is a fallback. The main flow uses Supabase auth (existing). The Telegram Mini App will use the existing web auth flow since it's already authenticated via Supabase in the browser.


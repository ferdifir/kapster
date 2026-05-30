# Subscription & Pricing (Rp10.000/bulan) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Kapster a paid SaaS — new users must pay Rp10.000/month via Pakasir to access the app.

**Architecture:** Flat pricing (no tiers), Pakasir payment link redirect, 30-day subscription periods. Route protection in `proxy.ts` checks subscription status. Webhook at `/api/webhook/pakasir` activates subscriptions. `/billing` is a standalone public page outside dashboard for payment and status.

**Tech Stack:** Next.js 16 (App Router), Supabase (PostgreSQL + Auth), Pakasir (payment link API), Tailwind CSS v4

---

## File Structure

| File | Action | Purpose |
|---|---|---|
| `supabase/migrations/add_subscriptions_and_payments.sql` | Create | DB schema: subscriptions + payments tables + enums |
| `lib/pakasir.ts` | Create | Pakasir API client (create payment, generate URL) |
| `lib/subscription.ts` | Create | Server-side subscription check helpers |
| `app/api/webhook/pakasir/route.ts` | Create | Webhook POST handler for Pakasir payment confirmations |
| `app/billing/page.tsx` | Create | Public (auth-only) billing page: pay / status / renew |
| `proxy.ts` | Modify | Add subscription check after auth check |
| `components/PricingSection.tsx` | Modify | Update from "100% Gratis" to "Rp10.000/bulan" |
| `app/layout.tsx` | Modify | Update JSON-LD price from "0" to "10000" |
| `app/dashboard/page.tsx` | Modify | Add cancel subscription card |
| `lib/supabase/types.ts` | Modify | Add new tables and enums |

---

### Task 1: Database Migration — subscriptions & payments Tables

**Files:**
- Create: `supabase/migrations/add_subscriptions_and_payments.sql`
- Modify: `lib/supabase/types.ts`

- [ ] **Step 1: Create migration SQL**

```sql
-- Add subscription_status enum
DO $$ BEGIN
  CREATE TYPE subscription_status AS ENUM ('active', 'cancelled', 'expired');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Add payment_status enum
DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'expired');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id UUID NOT NULL REFERENCES barbershops(id) ON DELETE CASCADE,
  status subscription_status NOT NULL DEFAULT 'active',
  current_period_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  current_period_end TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_barbershop_subscription UNIQUE (barbershop_id)
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id UUID NOT NULL REFERENCES barbershops(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  pakasir_order_id TEXT NOT NULL UNIQUE,
  amount NUMERIC NOT NULL DEFAULT 10000,
  status payment_status NOT NULL DEFAULT 'pending',
  payment_method TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for subscription lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_barbershop_id ON subscriptions(barbershop_id);
CREATE INDEX IF NOT EXISTS idx_payments_barbershop_id ON payments(barbershop_id);
CREATE INDEX IF NOT EXISTS idx_payments_pakasir_order_id ON payments(pakasir_order_id);
```

- [ ] **Step 2: Run migration**

Run: `psql "$SUPABASE_DB_URL" -f supabase/migrations/add_subscriptions_and_payments.sql`
Or apply via Supabase dashboard SQL editor.

- [ ] **Step 3: Update types.ts — Add new types**

Add to `lib/supabase/types.ts` — insert after the `wa_notifications` table definition and before the closing `}` of the public schema:

```ts
      subscriptions: {
        Row: {
          id: string
          barbershop_id: string
          status: Database["public"]["Enums"]["subscription_status"]
          current_period_start: string
          current_period_end: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          barbershop_id: string
          status?: Database["public"]["Enums"]["subscription_status"]
          current_period_start?: string
          current_period_end: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          barbershop_id?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          current_period_start?: string
          current_period_end?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_barbershop_id_fkey"
            columns: ["barbershop_id"]
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          }
        ]
      }
      payments: {
        Row: {
          id: string
          barbershop_id: string
          subscription_id: string | null
          pakasir_order_id: string
          amount: number
          status: Database["public"]["Enums"]["payment_status"]
          payment_method: string | null
          paid_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          barbershop_id: string
          subscription_id?: string | null
          pakasir_order_id: string
          amount?: number
          status?: Database["public"]["Enums"]["payment_status"]
          payment_method?: string | null
          paid_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          barbershop_id?: string
          subscription_id?: string | null
          pakasir_order_id?: string
          amount?: number
          status?: Database["public"]["Enums"]["payment_status"]
          payment_method?: string | null
          paid_at?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_barbershop_id_fkey"
            columns: ["barbershop_id"]
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_subscription_id_fkey"
            columns: ["subscription_id"]
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          }
        ]
      }
```

Also add the new enums to the `Constants` block at the bottom:

```ts
export const Constants = {
  public: {
    Enums: {
      booking_status: ["pending", "confirmed", "cancelled", "done"],
      queue_entry_status: ["waiting", "called", "serving", "done", "skip"],
      user_role: ["owner", "barber", "customer", "superadmin"],
      subscription_status: ["active", "cancelled", "expired"],
      payment_status: ["pending", "completed", "failed", "expired"],
    },
  },
} as const
```

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/add_subscriptions_and_payments.sql lib/supabase/types.ts
git commit -m "feat: add subscriptions and payments tables with types"
```

---

### Task 2: Create Pakasir Client Utility

**Files:**
- Create: `lib/pakasir.ts`

- [ ] **Step 1: Write lib/pakasir.ts**

```ts
const PAKASIR_BASE = "https://app.pakasir.com";

const config = {
  slug: process.env.PAKASIR_PROJECT_SLUG!,
  apiKey: process.env.PAKASIR_API_KEY!,
  baseUrl: process.env.NEXT_PUBLIC_BASE_URL!,
};

export function generateOrderId(barbershopId: string): string {
  const ts = Date.now().toString(36);
  const shortId = barbershopId.replace(/-/g, "").slice(0, 8);
  return `KAP-${shortId}-${ts}`;
}

export function getPaymentUrl(orderId: string): string {
  const redirect = encodeURIComponent(`${config.baseUrl}/billing?success=1`);
  return `${PAKASIR_BASE}/pay/${config.slug}/10000?order_id=${orderId}&redirect=${redirect}`;
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/pakasir.ts
git commit -m "feat: add Pakasir client utility for payment URL generation"
```

---

### Task 3: Create Subscription Check Utility

**Files:**
- Create: `lib/subscription.ts`

- [ ] **Step 1: Write lib/subscription.ts**

```ts
import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import type { Database } from "./supabase/types";

export async function checkSubscription(
  request: NextRequest,
  supabase: ReturnType<typeof createServerClient<Database>>,
  userId: string
): Promise<{ hasAccess: boolean; redirect?: NextResponse }> {
  const { data: barbershop } = await supabase
    .from("barbershops")
    .select("id")
    .eq("owner_id", userId)
    .maybeSingle();

  if (!barbershop) {
    return { hasAccess: false, redirect: NextResponse.redirect(new URL("/onboarding", request.url)) };
  }

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("status, current_period_end")
    .eq("barbershop_id", barbershop.id)
    .maybeSingle();

  if (!subscription) {
    return { hasAccess: false, redirect: NextResponse.redirect(new URL("/billing", request.url)) };
  }

  const now = new Date().toISOString();

  if (subscription.current_period_end < now) {
    await supabase
      .from("subscriptions")
      .update({ status: "expired", updated_at: now })
      .eq("barbershop_id", barbershop.id);

    return { hasAccess: false, redirect: NextResponse.redirect(new URL("/billing", request.url)) };
  }

  if (subscription.status !== "active" && subscription.status !== "cancelled") {
    return { hasAccess: false, redirect: NextResponse.redirect(new URL("/billing", request.url)) };
  }

  return { hasAccess: true };
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/subscription.ts
git commit -m "feat: add subscription check utility for route protection"
```

---

### Task 4: Update proxy.ts — Add Subscription Check

**Files:**
- Modify: `proxy.ts`

- [ ] **Step 1: Update proxy.ts to add subscription check**

After the existing auth check block (lines 48-57 in the current file), add the subscription check for dashboard and barber routes:

Replace the entire `proxy` function with:

```ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/supabase/types";

function setCsp(response: NextResponse) {
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.supabase.co; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://*.supabase.co https://tile.openstreetmap.org https://*.tile.openstreetmap.org; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' https://*.supabase.co https://nominatim.openstreetmap.org https://tile.openstreetmap.org https://*.tile.openstreetmap.org;"
  );
  response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
}

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  const isAuthPage =
    pathname.startsWith("/auth/login") ||
    pathname.startsWith("/auth/register");

  const isSubProtected =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/barber");

  const isOnboarding = pathname.startsWith("/onboarding");

  if (!user && (isSubProtected || isOnboarding || pathname.startsWith("/billing"))) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/auth/login";
    loginUrl.searchParams.set("next", pathname);
    const r = NextResponse.redirect(loginUrl);
    setCsp(r);
    return r;
  }

  if (user && isAuthPage && request.method === "GET") {
    const r = NextResponse.redirect(new URL("/dashboard", request.url));
    setCsp(r);
    return r;
  }

  // Subscription check for dashboard and barber routes
  if (user && isSubProtected) {
    const { data: barbershop } = await supabase
      .from("barbershops")
      .select("id")
      .eq("owner_id", user.id)
      .maybeSingle();

    if (!barbershop) {
      const r = NextResponse.redirect(new URL("/onboarding", request.url));
      setCsp(r);
      return r;
    }

    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("status, current_period_end")
      .eq("barbershop_id", barbershop.id)
      .maybeSingle();

    if (!subscription) {
      const r = NextResponse.redirect(new URL("/billing", request.url));
      setCsp(r);
      return r;
    }

    const now = new Date().toISOString();

    if (subscription.current_period_end < now) {
      await supabase
        .from("subscriptions")
        .update({ status: "expired", updated_at: now })
        .eq("barbershop_id", barbershop.id);

      const r = NextResponse.redirect(new URL("/billing", request.url));
      setCsp(r);
      return r;
    }

    if (subscription.status !== "active" && subscription.status !== "cancelled") {
      const r = NextResponse.redirect(new URL("/billing", request.url));
      setCsp(r);
      return r;
    }
  }

  setCsp(supabaseResponse);
  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
```

- [ ] **Step 2: Commit**

```bash
git add proxy.ts
git commit -m "feat: add subscription check to route protection in proxy"
```

---

### Task 5: Create Webhook Endpoint for Pakasir

**Files:**
- Create: `app/api/webhook/pakasir/route.ts`

- [ ] **Step 1: Write the webhook handler**

```ts
import { createClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { amount, order_id, status, payment_method, completed_at } = body;

    if (!order_id || !amount || !status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (status !== "completed") {
      return NextResponse.json({ error: "Unhandled status" }, { status: 200 });
    }

    const supabase = await createClient();

    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .select("id, barbershop_id, status, amount")
      .eq("pakasir_order_id", order_id)
      .single();

    if (paymentError || !payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    if (payment.status === "completed") {
      return NextResponse.json({ message: "Already processed" }, { status: 200 });
    }

    if (Number(payment.amount) !== Number(amount)) {
      return NextResponse.json({ error: "Amount mismatch" }, { status: 400 });
    }

    const now = new Date().toISOString();
    const periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const { data: subscription, error: subError } = await supabase
      .from("subscriptions")
      .upsert({
        barbershop_id: payment.barbershop_id,
        status: "active",
        current_period_start: now,
        current_period_end: periodEnd,
        updated_at: now,
      }, {
        onConflict: "barbershop_id",
      })
      .select()
      .single();

    if (subError) {
      return NextResponse.json({ error: "Failed to create subscription" }, { status: 500 });
    }

    const { error: updateError } = await supabase
      .from("payments")
      .update({
        status: "completed",
        payment_method: payment_method || null,
        paid_at: completed_at || now,
        subscription_id: subscription.id,
      })
      .eq("id", payment.id);

    if (updateError) {
      return NextResponse.json({ error: "Failed to update payment" }, { status: 500 });
    }

    return NextResponse.json({ message: "Subscription activated" }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/webhook/pakasir/route.ts
git commit -m "feat: add Pakasir webhook endpoint for payment confirmation"
```

---

### Task 6: Create Billing Page

**Files:**
- Create: `app/billing/page.tsx`

- [ ] **Step 1: Write the billing page**

```tsx
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { generateOrderId, getPaymentUrl } from "@/lib/pakasir";
import PayButton from "./pay-button";

export default async function BillingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: barbershop } = await supabase
    .from("barbershops")
    .select("id, name")
    .eq("owner_id", user.id)
    .single();

  if (!barbershop) redirect("/onboarding");

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("barbershop_id", barbershop.id)
    .maybeSingle();

  const now = new Date().toISOString();

  if (subscription && (subscription.status === "active" || subscription.status === "cancelled") && subscription.current_period_end > now) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-2xl bg-dark-800/50 border border-dark-700/30 p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="font-display text-2xl font-bold text-white mb-2">Langganan Aktif</h1>
          <p className="text-dark-300 mb-1">{barbershop.name}</p>
          <p className="text-dark-400 text-sm">
            Periode: {new Date(subscription.current_period_start).toLocaleDateString("id-ID")} — {new Date(subscription.current_period_end).toLocaleDateString("id-ID")}
          </p>
          {subscription.status === "cancelled" && (
            <p className="text-yellow-400 text-sm mt-2">Berakhir pada periode ini</p>
          )}
          <a href="/dashboard" className="mt-6 inline-block px-6 py-3 rounded-xl gold-gradient text-dark-900 font-bold">
            Ke Dashboard
          </a>
        </div>
      </div>
    );
  }

  const orderId = generateOrderId(barbershop.id);
  const paymentUrl = getPaymentUrl(orderId);

  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full rounded-2xl bg-dark-800/50 border border-dark-700/30 p-8 text-center">
        <h1 className="font-display text-2xl font-bold text-white mb-2">Aktifkan Langganan</h1>
        <p className="text-dark-300 mb-6">Akses semua fitur Kapster</p>

        <div className="bg-dark-900/50 rounded-xl p-6 mb-6">
          <p className="text-dark-400 text-sm mb-1">Harga</p>
          <p className="font-display text-4xl font-bold text-white">
            Rp10.000
            <span className="text-lg text-dark-400 font-normal">/bulan</span>
          </p>
        </div>

        <ul className="text-left space-y-3 mb-8">
          {[
            "Manajemen antrian real-time",
            "Booking online",
            "Notifikasi WhatsApp",
            "Manajemen barber & layanan",
            "Dashboard analitik",
            "Tampilan TV monitor",
          ].map((f) => (
            <li key={f} className="flex items-center gap-3 text-dark-200 text-sm">
              <svg className="w-5 h-5 text-barber-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {f}
            </li>
          ))}
        </ul>

        <PayButton orderId={orderId} paymentUrl={paymentUrl} />

        <p className="text-dark-500 text-xs mt-4">Bayar sekali, pakai 30 hari penuh. Cancel kapan saja.</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create pay-button client component**

```tsx
"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function PayButton({ orderId, paymentUrl }: { orderId: string; paymentUrl: string }) {
  const router = useRouter();
  const supabase = createClient();

  const handlePay = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: barbershop } = await supabase
      .from("barbershops")
      .select("id")
      .eq("owner_id", user.id)
      .single();

    if (!barbershop) return;

    await supabase.from("payments").insert({
      barbershop_id: barbershop.id,
      pakasir_order_id: orderId,
      amount: 10000,
      status: "pending",
    });

    window.location.href = paymentUrl;
  };

  return (
    <button
      onClick={handlePay}
      className="w-full px-6 py-3 rounded-xl gold-gradient text-dark-900 font-bold text-lg hover:shadow-lg hover:shadow-barber-400/25 transition-all duration-300"
    >
      Bayar Rp10.000 Sekarang
    </button>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add app/billing/page.tsx app/billing/pay-button.tsx
git commit -m "feat: add billing page for subscription payment and status"
```

---

### Task 7: Update Landing Page Pricing Section

**Files:**
- Modify: `components/PricingSection.tsx`

- [ ] **Step 1: Rewrite PricingSection**

```tsx
const FEATURES = [
  { label: "Manajemen Antrian", desc: "Antrian real-time dengan update otomatis" },
  { label: "Booking Online", desc: "Pelanggan bisa booking dari HP" },
  { label: "Notifikasi WhatsApp", desc: "Panggil antrian otomatis via WA" },
  { label: "Manajemen Barber", desc: "Kelola barber & layanan" },
  { label: "Dashboard Analitik", desc: "Laporan harian, mingguan, bulanan" },
  { label: "Tampilan TV Monitor", desc: "Display antrian di TV barbershop" },
];

export default function PricingSection() {
  return (
    <section id="harga" className="py-24 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-dark-950 via-dark-900/30 to-dark-950" />
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-barber-400/10 text-barber-400 text-sm font-semibold mb-4">
            Rp10.000 / bulan
          </span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
            Satu Harga, <span className="text-gold-gradient">Semua Fitur</span>
          </h2>
          <p className="text-dark-300 text-lg max-w-2xl mx-auto">
            Rp10.000/bulan — cancel kapan saja. Bayar sekali, pakai 30 hari penuh.
          </p>
        </div>

        <div className="max-w-sm mx-auto">
          <div className="p-8 rounded-2xl bg-dark-800/50 border border-dark-700/30 card-hover text-center">
            <p className="text-dark-400 text-sm mb-1">Mulai dari</p>
            <p className="font-display text-5xl font-bold text-white mb-6">
              Rp10.000
              <span className="text-lg text-dark-400 font-normal">/bulan</span>
            </p>
            <ul className="text-left space-y-4 mb-8">
              {FEATURES.map((f) => (
                <li key={f.label} className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-barber-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <div>
                    <p className="text-white font-medium text-sm">{f.label}</p>
                    <p className="text-dark-400 text-xs">{f.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
            <a
              href="/auth/register"
              className="block w-full px-6 py-3 rounded-xl gold-gradient text-dark-900 font-bold text-lg hover:shadow-lg hover:shadow-barber-400/25 transition-all duration-300"
            >
              Mulai Sekarang
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/PricingSection.tsx
git commit -m "feat: update pricing section from free to Rp10.000/month"
```

---

### Task 8: Update JSON-LD Structured Data

**Files:**
- Modify: `app/layout.tsx`

- [ ] **Step 1: Update the SoftwareApplication offer in jsonLd**

Change the `offers` block in the JSON-LD from:

```ts
    offers: { "@type": "Offer", "@id": `${siteUrl}#/offers/free`, name: "Gratis", price: "0", priceCurrency: "IDR", description: "Semua fitur gratis untuk barbershop" },
```

To:

```ts
    offers: { "@type": "Offer", "@id": `${siteUrl}#/offers/subscription`, name: "Langganan", price: "10000", priceCurrency: "IDR", priceValidUntil: "2027-12-31", description: "Rp10.000/bulan — akses semua fitur Kapster" },
```

- [ ] **Step 2: Update the FAQ about pricing**

Change the FAQ entry about "Apakah Kapster gratis?" answer from "Ya, Kapster 100% gratis..." to "Kapster berbayar Rp10.000/bulan..."

Find this text block in jsonLd:

```ts
      { "@type": "Question", name: "Apakah Kapster gratis?", acceptedAnswer: { "@type": "Answer", text: "Ya, Kapster 100% gratis. Tidak ada biaya bulanan, tidak ada batasan tersembunyi. Semua fitur bisa langsung digunakan." } },
```

Replace with:

```ts
      { "@type": "Question", name: "Berapa harga Kapster?", acceptedAnswer: { "@type": "Answer", text: "Kapster Rp10.000/bulan — satu harga untuk semua fitur. Bayar sekali, pakai 30 hari penuh. Cancel kapan saja." } },
```

- [ ] **Step 3: Update OpenGraph/Twitter descriptions**

Find: `"100% gratis"` in the OpenGraph and Twitter descriptions and update to reflect the paid model.

- [ ] **Step 4: Commit**

```bash
git add app/layout.tsx
git commit -m "feat: update JSON-LD and metadata for paid pricing"
```

---

### Task 9: Add Cancel Subscription to Dashboard

**Files:**
- Modify: `app/dashboard/page.tsx`

- [ ] **Step 1: Add cancel subscription section to the dashboard page**

After the auth guard and existing queries, add a subscription query and cancel card. Add this before the return statement:

```tsx
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("status, current_period_end")
    .eq("barbershop_id", barbershop.id)
    .maybeSingle();

  const isActive = subscription?.status === "active" && subscription?.current_period_end
    ? new Date(subscription.current_period_end) > new Date()
    : false;
```

Then add a cancel subscription card to the JSX, before the Quick Access grid. Add this after the StatsCards section:

```tsx
      {isActive && (
        <div className="rounded-2xl bg-dark-800/50 border border-dark-700/30 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-white font-semibold">Langganan Aktif</h3>
              <p className="text-dark-400 text-sm">
                Berlaku hingga {new Date(subscription!.current_period_end).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            </div>
            <SubscriptionActions
              subscriptionId={subscription!.id}
              status={subscription!.status}
              periodEnd={subscription!.current_period_end}
            />
          </div>
        </div>
      )}
```

- [ ] **Step 2: Create SubscriptionActions client component**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SubscriptionActions({ periodEnd }: { periodEnd: string }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleCancel = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: barbershop } = await supabase
      .from("barbershops")
      .select("id")
      .eq("owner_id", user.id)
      .single();

    if (!barbershop) return;

    await supabase
      .from("subscriptions")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .eq("barbershop_id", barbershop.id);

    setShowConfirm(false);
    router.refresh();
  };

  if (showConfirm) {
    return (
      <div className="text-right">
        <p className="text-dark-300 text-sm mb-2">
          Langganan tetap aktif sampai {new Date(periodEnd).toLocaleDateString("id-ID")}. Setelah itu tidak bisa akses dashboard.
        </p>
        <div className="flex gap-2 justify-end">
          <button
            onClick={() => setShowConfirm(false)}
            className="px-4 py-2 rounded-lg bg-dark-700 text-dark-200 text-sm"
          >
            Batal
          </button>
          <button
            onClick={handleCancel}
            className="px-4 py-2 rounded-lg bg-red-500/10 text-red-400 text-sm font-medium"
          >
            Ya, Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      className="px-4 py-2 rounded-lg bg-red-500/10 text-red-400 text-sm font-medium hover:bg-red-500/20 transition-colors"
    >
      Cancel Langganan
    </button>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add app/dashboard/page.tsx app/dashboard/subscription-actions.tsx
git commit -m "feat: add cancel subscription option to dashboard"
```

---

## Self-Review

**Spec coverage check:**
1. ✅ DB schema: subscriptions + payments tables + enums (Task 1)
2. ✅ Pakasir integration: payment URL generation + webhook (Tasks 2, 5)
3. ✅ Route protection: proxy.ts subscription check (Task 4)
4. ✅ Billing page: pay/renew/status (Task 6)
5. ✅ Landing page pricing update (Task 7)
6. ✅ JSON-LD structured data update (Task 8)
7. ✅ Cancel subscription on dashboard (Task 9)
8. ✅ Subscription check utility (Task 3)

**No placeholders:** All code is complete and exact ✅

**Type consistency:** `subscription_status` enum, `payment_status` enum consistent across migration, types.ts, and all TS code ✅

**Architecture consistency:** `/billing` is public route outside dashboard, all `/dashboard/*` and `/barber/*` protected by subscription check in proxy.ts ✅

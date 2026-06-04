# Referral / Affiliate System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement two-way referral system: lightweight referrers (name+WA, token auth) and barbershop owners can refer new shops, earning Rp3.500 commission per paid referral.

**Architecture:** New DB tables (`referral_codes`, `referrals`, `payout_requests`), cookie-based tracking (45-day expiry), token-based auth for lightweight referrers, commission credited via Pakasir webhook extension, referral-linked onboarding discount.

**Tech Stack:** Next.js 16, Supabase (Postgres), Pakasir, WuzAPI (WA), TypeScript

---

### File Structure

| File | Responsibility |
|---|---|
| `supabase/migrations/add_referral_system.sql` | Create referral_codes, referrals, payout_requests tables |
| `lib/referral-types.ts` | Supplemental TypeScript types for new tables |
| `lib/referral.ts` | Server utilities: createReferralCode, getReferrerByCode, creditReferralCommission, getReferrerStats |
| `components/ReferralCookieSetter.tsx` | Client component: reads `?ref=` from URL, sets cookie `referrer_code` for 45 days |
| `components/ReferralBanner.tsx` | Client component: checks cookie on onboarding, shows discount banner, sends code via hidden input |
| `app/referral/daftar/page.tsx` | Lightweight referrer registration form (name + WA) |
| `app/referral/actions.ts` | Server actions: daftarReferrer, requestPayout |
| `app/referral/[code]/page.tsx` | Referrer performance page (token-gated) |
| `app/dashboard/referrals/page.tsx` | Barbershop owner referral page |
| `app/admin/referrals/page.tsx` | Admin referral management |
| `app/api/webhook/pakasir/route.ts` | Extend to credit commission on first payment |
| `app/onboarding/page.tsx` | Add cookie check and referral code submission |

---

### Task 1: Database Migration

**Files:**
- Create: `supabase/migrations/add_referral_system.sql`

- [ ] **Step 1: Write migration SQL**

```sql
-- Referral codes: one per referrer (profile-linked or lightweight)
DO $$ BEGIN
  CREATE TYPE referral_status AS ENUM ('pending', 'earned', 'paid');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE payout_status AS ENUM ('pending', 'paid', 'cancelled');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS referral_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  name TEXT,
  wa_number TEXT,
  code TEXT UNIQUE NOT NULL,
  access_token TEXT UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
  balance INTEGER NOT NULL DEFAULT 0,
  total_earned INTEGER NOT NULL DEFAULT 0,
  total_withdrawn INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON referral_codes(code);
CREATE INDEX IF NOT EXISTS idx_referral_codes_profile_id ON referral_codes(profile_id);

ALTER TABLE referral_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read referral codes by code"
  ON referral_codes FOR SELECT
  USING (true);

CREATE POLICY "Profile owners can view their own referral code"
  ON referral_codes FOR SELECT
  USING (profile_id = auth.uid());

CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_code_id UUID NOT NULL REFERENCES referral_codes(id) ON DELETE CASCADE,
  barbershop_id UUID NOT NULL REFERENCES barbershops(id) ON DELETE CASCADE,
  status referral_status NOT NULL DEFAULT 'pending',
  commission INTEGER NOT NULL DEFAULT 3500,
  earned_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_referral_barbershop UNIQUE (barbershop_id)
);

CREATE INDEX IF NOT EXISTS idx_referrals_referral_code_id ON referrals(referral_code_id);
CREATE INDEX IF NOT EXISTS idx_referrals_barbershop_id ON referrals(barbershop_id);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);

ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all referrals"
  ON referrals FOR SELECT
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'superadmin'));

CREATE POLICY "Referrers can view their own referrals"
  ON referrals FOR SELECT
  USING (referral_code_id IN (SELECT id FROM referral_codes WHERE profile_id = auth.uid()));

CREATE TABLE IF NOT EXISTS payout_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_code_id UUID NOT NULL REFERENCES referral_codes(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL CHECK (amount >= 25000),
  method TEXT,
  bank_info JSONB,
  status payout_status NOT NULL DEFAULT 'pending',
  notes TEXT,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_payout_requests_status ON payout_requests(status);

ALTER TABLE payout_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all payout requests"
  ON payout_requests FOR SELECT
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'superadmin'));

CREATE POLICY "Referrers can view their own payout requests"
  ON payout_requests FOR SELECT
  USING (referral_code_id IN (SELECT id FROM referral_codes WHERE profile_id = auth.uid()));
```

- [ ] **Step 2: Run migration**

Supabase migration tooling is manual here. Provide the SQL to apply via Supabase dashboard SQL editor or CLI.

---

### Task 2: Server Utilities (lib/referral.ts)

**Files:**
- Create: `lib/referral.ts`

- [ ] **Step 1: Create lib/referral.ts**

```ts
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { sendTextMessage } from "@/lib/wuzapi";
import { renderWATemplate } from "@/lib/wa-templates";

export async function createReferralCode(input: {
  profileId?: string;
  name?: string;
  waNumber?: string;
  code: string;
}) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("referral_codes")
    .insert({
      profile_id: input.profileId || null,
      name: input.name || null,
      wa_number: input.waNumber || null,
      code: input.code,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getReferrerByCode(code: string) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("referral_codes")
    .select("*")
    .eq("code", code)
    .single();
  return data;
}

export async function getReferrerByAccessToken(token: string) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("referral_codes")
    .select("*")
    .eq("access_token", token)
    .single();
  return data;
}

export async function createReferralRecord(referralCodeId: string, barbershopId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("referrals")
    .insert({
      referral_code_id: referralCodeId,
      barbershop_id: barbershopId,
    })
    .select()
    .single();

  if (error && error.code === "23505") {
    // Unique violation — barbershop already has a referral, skip silently
    return null;
  }
  if (error) throw error;
  return data;
}

export async function creditReferralCommission(barbershopId: string) {
  const supabase = createAdminClient();

  const { data: referral } = await supabase
    .from("referrals")
    .select("id, referral_code_id, status")
    .eq("barbershop_id", barbershopId)
    .eq("status", "pending")
    .single();

  if (!referral) return null;

  const now = new Date().toISOString();

  const { error: referralUpdateError } = await supabase
    .from("referrals")
    .update({ status: "earned", earned_at: now })
    .eq("id", referral.id);

  if (referralUpdateError) throw referralUpdateError;

  const commission = 3500;

  const { error: balanceError } = await supabase.rpc("increment_referral_balance", {
    p_referral_code_id: referral.referral_code_id,
    p_amount: commission,
  });

  if (balanceError) {
    // Fallback: fetch and update directly
    const { data: rc } = await supabase
      .from("referral_codes")
      .select("balance, total_earned")
      .eq("id", referral.referral_code_id)
      .single();

    if (rc) {
      await supabase
        .from("referral_codes")
        .update({
          balance: rc.balance + commission,
          total_earned: rc.total_earned + commission,
        })
        .eq("id", referral.referral_code_id);
    }
  }

  return { commission };
}

export async function getReferralStats(referralCodeId: string) {
  const supabase = createAdminClient();

  const [rcResult, referralsResult] = await Promise.all([
    supabase.from("referral_codes").select("*").eq("id", referralCodeId).single(),
    supabase
      .from("referrals")
      .select("id, barbershop_id, status, commission, earned_at, created_at")
      .eq("referral_code_id", referralCodeId)
      .order("created_at", { ascending: false }),
  ]);

  const barbershopIds = (referralsResult.data || [])
    .map((r) => r.barbershop_id)
    .filter(Boolean);

  let shopNames: Record<string, string> = {};
  if (barbershopIds.length > 0) {
    const { data: shops } = await supabase
      .from("barbershops")
      .select("id, name")
      .in("id", barbershopIds);
    if (shops) {
      shopNames = Object.fromEntries(shops.map((s) => [s.id, s.name]));
    }
  }

  return {
    referrer: rcResult.data,
    referrals: (referralsResult.data || []).map((r) => ({
      ...r,
      shop_name: shopNames[r.barbershop_id] || "Unknown",
    })),
  };
}

export async function createReferralCodeForProfile(profileId: string) {
  const supabase = createAdminClient();

  const { data: existing } = await supabase
    .from("referral_codes")
    .select("*")
    .eq("profile_id", profileId)
    .single();

  if (existing) return existing;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", profileId)
    .single();

  const { data: barbershop } = await supabase
    .from("barbershops")
    .select("slug")
    .eq("owner_id", profileId)
    .single();

  const base = barbershop?.slug || profile?.full_name || "user";
  const code = base
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 30);

  const { data, error } = await supabase
    .from("referral_codes")
    .insert({ profile_id: profileId, code })
    .select()
    .single();

  if (error) throw error;
  return data;
}
```

Note: The RPC `increment_referral_balance` is used as an optimization. Create it via SQL:

```sql
CREATE OR REPLACE FUNCTION increment_referral_balance(
  p_referral_code_id UUID,
  p_amount INTEGER
) RETURNS void AS $$
BEGIN
  UPDATE referral_codes
  SET balance = balance + p_amount,
      total_earned = total_earned + p_amount
  WHERE id = p_referral_code_id;
END;
$$ LANGUAGE plpgsql;
```

---

### Task 3: Cookie Handling Component

**Files:**
- Create: `components/ReferralCookieSetter.tsx`
- Modify: `app/layout.tsx`

- [ ] **Step 1: Create ReferralCookieSetter component**

```tsx
"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

const COOKIE_NAME = "referrer_code";
const COOKIE_MAX_AGE = 45 * 24 * 60 * 60; // 45 days

export default function ReferralCookieSetter() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref && /^[a-zA-Z0-9_-]{1,50}$/.test(ref)) {
      document.cookie = `${COOKIE_NAME}=${encodeURIComponent(ref)}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
    }
  }, [searchParams]);

  return null;
}
```

- [ ] **Step 2: Add to root layout**

In `app/layout.tsx`, import and render `ReferralCookieSetter` inside the `<body>` (alongside other client components). Since the root layout is a server component, wrap with `<Suspense>` (required for `useSearchParams`).

```tsx
// Add imports:
import { Suspense } from "react";
import ReferralCookieSetter from "@/components/ReferralCookieSetter";

// Inside <body>, before or after {children}:
<Suspense fallback={null}>
  <ReferralCookieSetter />
</Suspense>
```

---

### Task 4: Lightweight Referrer Registration

**Files:**
- Create: `app/referral/actions.ts`
- Create: `app/referral/daftar/page.tsx`

- [ ] **Step 1: Create server actions**

```ts
"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { sendTextMessage } from "@/lib/wuzapi";
import { revalidatePath } from "next/cache";

function generateCode(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .substring(0, 20);
  const suffix = Math.random().toString(36).substring(2, 6);
  return `${base}-${suffix}`;
}

function generateToken(): string {
  return crypto.randomUUID();
}

export async function daftarReferrer(formData: FormData) {
  const name = formData.get("name") as string;
  const waNumber = formData.get("wa_number") as string;

  if (!name || name.length < 2) {
    return { error: "Nama minimal 2 karakter" };
  }
  if (!waNumber || waNumber.length < 8) {
    return { error: "Nomor WhatsApp tidak valid" };
  }

  const normalizedWa = waNumber.startsWith("0")
    ? "62" + waNumber.substring(1)
    : waNumber.startsWith("62")
      ? waNumber
      : "62" + waNumber;

  const supabase = createAdminClient();
  const code = generateCode(name);
  const token = generateToken();

  const { data, error } = await supabase
    .from("referral_codes")
    .insert({
      name,
      wa_number: normalizedWa,
      code,
      access_token: token,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      // Code collision, retry with different suffix
      const code2 = generateCode(name) + Math.random().toString(36).substring(2, 4);
      const { data: d2, error: e2 } = await supabase
        .from("referral_codes")
        .insert({ name, wa_number: normalizedWa, code: code2, access_token: generateToken() })
        .select()
        .single();
      if (e2) return { error: "Gagal mendaftar. Coba lagi." };
      await sendWaNotification(normalizedWa, name, code2, d2.access_token);
      return { success: true, code: code2, token: d2.access_token };
    }
    return { error: "Gagal mendaftar. Coba lagi." };
  }

  await sendWaNotification(normalizedWa, name, code, data.access_token);
  return { success: true, code, token: data.access_token };
}

async function sendWaNotification(phone: string, name: string, code: string, token: string) {
  const referralLink = `https://kapster.my.id?ref=${code}`;
  const perfLink = `https://kapster.my.id/referral/${code}?t=${token}`;
  const message = [
    `Halo ${name}! Terima kasih sudah mendaftar referral Kapster.`,
    ``,
    `🔗 Link referral kamu: ${referralLink}`,
    `📊 Pantau performa: ${perfLink}`,
    ``,
    `Bagikan link referral ke pemilik barbershop. Dapatkan Rp3.500 untuk setiap yang daftar dan aktif!`,
    ``,
    `Sent via kapster.my.id`,
  ].join("\n");

  try {
    const { SYSTEM_WUZAPI_TOKEN } = process.env;
    if (SYSTEM_WUZAPI_TOKEN) {
      await sendTextMessage(SYSTEM_WUZAPI_TOKEN, phone, message);
    }
  } catch (err) {
    console.error("Failed to send WA notification:", err);
  }
}

export async function requestPayout(formData: FormData) {
  const referralCodeId = formData.get("referral_code_id") as string;
  const amount = parseInt(formData.get("amount") as string);
  const method = formData.get("method") as string;
  const bankInfoRaw = formData.get("bank_info") as string;

  if (!referralCodeId || !amount || amount < 25000) {
    return { error: "Jumlah minimum Rp25.000" };
  }

  const supabase = createAdminClient();
  const { data: rc } = await supabase
    .from("referral_codes")
    .select("balance")
    .eq("id", referralCodeId)
    .single();

  if (!rc || rc.balance < amount) {
    return { error: "Saldo tidak mencukupi" };
  }

  const { error } = await supabase.from("payout_requests").insert({
    referral_code_id: referralCodeId,
    amount,
    method: method || null,
    bank_info: bankInfoRaw ? JSON.parse(bankInfoRaw) : null,
  });

  if (error) return { error: "Gagal mengirim permintaan" };

  return { success: true };
}
```

- [ ] **Step 2: Create registration page**

```tsx
"use client";

import { useState } from "react";
import { daftarReferrer } from "@/app/referral/actions";
import Logo from "@/components/Logo";

export default function DaftarReferrerPage() {
  const [name, setName] = useState("");
  const [waNumber, setWaNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ code: string; token: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = new FormData();
    form.set("name", name);
    form.set("wa_number", waNumber);

    const res = await daftarReferrer(form);
    if (res.error) {
      setError(res.error);
      setLoading(false);
      return;
    }

    setResult({ code: res.code!, token: res.token! });
    setLoading(false);
  };

  if (result) {
    const referralLink = `https://kapster.my.id?ref=${result.code}`;
    const perfLink = `https://kapster.my.id/referral/${result.code}?t=${result.token}`;

    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center px-4">
        <div className="w-full max-w-lg text-center">
          <div className="w-12 h-12 rounded-xl gold-gradient flex items-center justify-center mx-auto mb-4">
            <Logo className="w-7 h-7 text-dark-900" />
          </div>
          <h1 className="font-display text-2xl font-bold text-white mb-2">
            Pendaftaran Berhasil!
          </h1>
          <p className="text-dark-400 text-sm mb-8">
            Bagikan link referral ini ke pemilik barbershop
          </p>

          <div className="bg-dark-800/50 border border-dark-700/30 rounded-2xl p-6 space-y-4">
            <div className="text-left">
              <label className="block text-dark-300 text-sm font-medium mb-2">
                Link Referral
              </label>
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={referralLink}
                  className="flex-1 px-4 py-3 rounded-xl bg-dark-700/50 border border-dark-600/50 text-white text-sm"
                />
                <button
                  onClick={() => navigator.clipboard.writeText(referralLink)}
                  className="px-4 py-3 rounded-xl gold-gradient text-dark-900 font-semibold text-sm whitespace-nowrap"
                >
                  Salin
                </button>
              </div>
            </div>

            <div className="text-left">
              <label className="block text-dark-300 text-sm font-medium mb-2">
                Link Pantau Performa
              </label>
              <p className="text-dark-500 text-xs mb-2">
                Simpan link ini untuk melihat pendapatan kamu.
              </p>
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={perfLink}
                  className="flex-1 px-4 py-3 rounded-xl bg-dark-700/50 border border-dark-600/50 text-white text-sm"
                />
                <button
                  onClick={() => navigator.clipboard.writeText(perfLink)}
                  className="px-4 py-3 rounded-xl gold-gradient text-dark-900 font-semibold text-sm whitespace-nowrap"
                >
                  Salin
                </button>
              </div>
            </div>

            <a
              href={perfLink}
              className="block w-full py-3 rounded-xl bg-dark-700/50 border border-dark-600/50 text-dark-200 hover:border-barber-400/50 transition-colors text-center font-semibold"
            >
              Lihat Halaman Performa
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center px-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl gold-gradient flex items-center justify-center mx-auto mb-4">
            <Logo className="w-7 h-7 text-dark-900" />
          </div>
          <h1 className="font-display text-2xl font-bold text-white mb-1">
            Dapatkan Link Referral
          </h1>
          <p className="text-dark-400 text-sm">
            Dapatkan Rp3.500 untuk setiap barbershop yang daftar via link kamu
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-dark-800/50 border border-dark-700/30 rounded-2xl p-8 space-y-5"
        >
          {error && (
            <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-dark-300 text-sm font-medium mb-2">
              Nama <span className="text-barber-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Nama kamu"
              className="w-full px-4 py-3 rounded-xl bg-dark-700/50 border border-dark-600/50 text-white placeholder-dark-500 focus:outline-none focus:border-barber-400/50 transition-colors"
            />
          </div>

          <div>
            <label className="block text-dark-300 text-sm font-medium mb-2">
              Nomor WhatsApp <span className="text-barber-400">*</span>
            </label>
            <div className="flex items-center rounded-xl overflow-hidden border border-dark-600/50 focus-within:border-barber-400/50 transition-colors">
              <span className="px-3 py-3 bg-dark-700/80 text-dark-400 text-sm border-r border-dark-600/50">
                +62
              </span>
              <input
                type="tel"
                value={waNumber}
                onChange={(e) => setWaNumber(e.target.value)}
                required
                placeholder="812 3456 7890"
                className="flex-1 px-3 py-3 bg-dark-700/50 text-white placeholder-dark-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-barber-400/5 border border-barber-400/15">
            <p className="text-dark-300 text-sm">
              🎯 Dapatkan <span className="text-barber-400 font-semibold">Rp3.500</span> untuk setiap pemilik barbershop yang daftar dan aktifkan subscription via link kamu.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl gold-gradient text-dark-900 font-bold transition-all duration-300 hover:shadow-lg hover:shadow-barber-400/25 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Memproses..." : "Dapatkan Link Referral"}
          </button>
        </form>
      </div>
    </div>
  );
}
```

---

### Task 5: Referrer Performance Page (Token-Gated)

**Files:**
- Create: `app/referral/[code]/page.tsx`

- [ ] **Step 1: Create performance page**

```tsx
import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import ReferrerDashboard from "./ReferrerDashboard";

interface Props {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ t?: string }>;
}

export default async function ReferralCodePage({ params, searchParams }: Props) {
  const { code } = await params;
  const { t } = await searchParams;

  if (!t) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="font-display text-2xl font-bold text-white mb-2">
            Link Tidak Valid
          </h1>
          <p className="text-dark-400 text-sm">
            Kamu perlu token akses untuk melihat halaman ini. Cek link yang dikirim via WhatsApp.
          </p>
        </div>
      </div>
    );
  }

  const supabase = createAdminClient();

  const { data: rc } = await supabase
    .from("referral_codes")
    .select("*")
    .eq("code", code)
    .eq("access_token", t)
    .single();

  if (!rc) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="font-display text-2xl font-bold text-white mb-2">
            Akses Ditolak
          </h1>
          <p className="text-dark-400 text-sm">Token akses tidak cocok.</p>
        </div>
      </div>
    );
  }

  const { data: referralRows } = await supabase
    .from("referrals")
    .select("*")
    .eq("referral_code_id", rc.id)
    .order("created_at", { ascending: false });

  const barbershopIds = (referralRows || []).map((r) => r.barbershop_id).filter(Boolean);
  let shopNames: Record<string, string> = {};
  if (barbershopIds.length > 0) {
    const { data: shops } = await supabase
      .from("barbershops")
      .select("id, name")
      .in("id", barbershopIds);
    if (shops) {
      shopNames = Object.fromEntries(shops.map((s) => [s.id, s.name]));
    }
  }

  const referrals = (referralRows || []).map((r) => ({
    ...r,
    shop_name: shopNames[r.barbershop_id] || "Unknown",
  }));

  const pendingCount = referrals.filter((r) => r.status === "pending").length;
  const earnedCount = referrals.filter((r) => r.status === "earned").length;

  return <ReferrerDashboard rc={rc} referrals={referrals} pendingCount={pendingCount} earnedCount={earnedCount} />;
}
```

- [ ] **Step 2: Create ReferrerDashboard client component**

```tsx
"use client";

import { useState } from "react";
import Logo from "@/components/Logo";
import { requestPayout } from "@/app/referral/actions";

interface ReferrerData {
  id: string;
  code: string;
  name: string | null;
  wa_number: string | null;
  balance: number;
  total_earned: number;
  total_withdrawn: number;
  created_at: string;
}

interface ReferralRow {
  id: string;
  shop_name: string;
  status: string;
  commission: number;
  earned_at: string | null;
  created_at: string;
}

export default function ReferrerDashboard({
  rc,
  referrals,
  pendingCount,
  earnedCount,
}: {
  rc: ReferrerData;
  referrals: ReferralRow[];
  pendingCount: number;
  earnedCount: number;
}) {
  const referralLink = `https://kapster.my.id?ref=${rc.code}`;
  const [showPayout, setShowPayout] = useState(false);
  const [payoutMethod, setPayoutMethod] = useState("bank_transfer");
  const [bankName, setBankName] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [bankHolder, setBankHolder] = useState("");
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [payoutError, setPayoutError] = useState("");
  const [payoutSuccess, setPayoutSuccess] = useState(false);

  const handlePayout = async (e: React.FormEvent) => {
    e.preventDefault();
    setPayoutLoading(true);
    setPayoutError("");

    const form = new FormData();
    form.set("referral_code_id", rc.id);
    form.set("amount", String(rc.balance));
    form.set("method", payoutMethod);
    form.set("bank_info", JSON.stringify({
      bank: bankName,
      account: bankAccount,
      holder: bankHolder,
    }));

    const res = await requestPayout(form);
    if (res.error) {
      setPayoutError(res.error);
      setPayoutLoading(false);
      return;
    }

    setPayoutSuccess(true);
    setPayoutLoading(false);
  };

  return (
    <div className="min-h-screen bg-dark-950">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl gold-gradient flex items-center justify-center">
            <Logo className="w-6 h-6 text-dark-900" />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold text-white">
              Halo, {rc.name || "Referrer"}!
            </h1>
            <p className="text-dark-400 text-xs">Pendapatan referral kamu</p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-dark-800/50 border border-dark-700/30 rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-white">{referrals.length}</p>
            <p className="text-dark-400 text-xs mt-1">Total Diajak</p>
          </div>
          <div className="bg-dark-800/50 border border-dark-700/30 rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-barber-400">{earnedCount}</p>
            <p className="text-dark-400 text-xs mt-1">Sudah Bayar</p>
          </div>
          <div className="bg-dark-800/50 border border-dark-700/30 rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-dark-400">{pendingCount}</p>
            <p className="text-dark-400 text-xs mt-1">Menunggu</p>
          </div>
        </div>

        {/* Balance Card */}
        <div className="bg-gradient-to-r from-barber-400/10 to-barber-600/10 border border-barber-400/20 rounded-2xl p-6 mb-8">
          <p className="text-dark-400 text-sm">Saldo kamu</p>
          <p className="font-display text-4xl font-bold text-white mt-1">
            Rp{rc.balance.toLocaleString("id-ID")}
          </p>
          <div className="flex gap-3 mt-4">
            <button
              onClick={() => setShowPayout(true)}
              disabled={rc.balance < 25000}
              className="px-6 py-2.5 rounded-xl gold-gradient text-dark-900 font-semibold text-sm transition-all hover:shadow-lg hover:shadow-barber-400/25 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Tarik Saldo
            </button>
          </div>
          <p className="text-dark-500 text-xs mt-2">
            Minimum tarik: Rp25.000 • Total sudah ditarik: Rp{rc.total_withdrawn.toLocaleString("id-ID")}
          </p>
        </div>

        {/* Referral Link */}
        <div className="bg-dark-800/50 border border-dark-700/30 rounded-2xl p-6 mb-8">
          <label className="block text-dark-300 text-sm font-medium mb-2">
            Link Referral Kamu
          </label>
          <div className="flex items-center gap-2">
            <input
              readOnly
              value={referralLink}
              className="flex-1 px-4 py-3 rounded-xl bg-dark-700/50 border border-dark-600/50 text-white text-sm"
            />
            <button
              onClick={() => navigator.clipboard.writeText(referralLink)}
              className="px-4 py-3 rounded-xl gold-gradient text-dark-900 font-semibold text-sm whitespace-nowrap"
            >
              Salin
            </button>
          </div>
        </div>

        {/* Referral List */}
        <div className="bg-dark-800/50 border border-dark-700/30 rounded-2xl p-6">
          <h2 className="font-semibold text-white mb-4">Riwayat Referral</h2>
          {referrals.length === 0 ? (
            <p className="text-dark-500 text-sm">Belum ada referral. Bagikan link kamu!</p>
          ) : (
            <div className="space-y-3">
              {referrals.map((ref) => (
                <div
                  key={ref.id}
                  className="flex items-center justify-between py-3 border-b border-dark-700/30 last:border-0"
                >
                  <div>
                    <p className="text-white text-sm font-medium">{ref.shop_name}</p>
                    <p className="text-dark-500 text-xs">
                      {new Date(ref.created_at).toLocaleDateString("id-ID")}
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                        ref.status === "earned"
                          ? "bg-green-500/10 text-green-400"
                          : ref.status === "paid"
                            ? "bg-blue-500/10 text-blue-400"
                            : "bg-dark-700 text-dark-400"
                      }`}
                    >
                      {ref.status === "earned"
                        ? `Rp${ref.commission.toLocaleString("id-ID")}`
                        : ref.status === "paid"
                          ? "Ditarik"
                          : "Menunggu"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Payout Modal */}
      {showPayout && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
          <div className="bg-dark-800 w-full max-w-md rounded-2xl p-6 border border-dark-700/30">
            <h2 className="font-semibold text-white text-lg mb-4">Tarik Saldo</h2>

            {payoutSuccess ? (
              <div className="text-center py-8">
                <p className="text-green-400 font-semibold mb-2">Permintaan terkirim!</p>
                <p className="text-dark-400 text-sm">
                  Admin akan memproses dalam 1x24 jam. Kamu akan dihubungi via WhatsApp.
                </p>
                <button
                  onClick={() => { setShowPayout(false); setPayoutSuccess(false); }}
                  className="mt-4 px-6 py-2.5 rounded-xl gold-gradient text-dark-900 font-semibold text-sm"
                >
                  Tutup
                </button>
              </div>
            ) : (
              <form onSubmit={handlePayout} className="space-y-4">
                {payoutError && (
                  <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    {payoutError}
                  </div>
                )}

                <div>
                  <label className="block text-dark-300 text-sm font-medium mb-2">
                    Jumlah
                  </label>
                  <input
                    type="number"
                    value={rc.balance}
                    readOnly
                    className="w-full px-4 py-3 rounded-xl bg-dark-700/50 border border-dark-600/50 text-white"
                  />
                </div>

                <div>
                  <label className="block text-dark-300 text-sm font-medium mb-2">
                    Metode
                  </label>
                  <select
                    value={payoutMethod}
                    onChange={(e) => setPayoutMethod(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-dark-700/50 border border-dark-600/50 text-white"
                  >
                    <option value="bank_transfer">Transfer Bank</option>
                  </select>
                </div>

                <div>
                  <label className="block text-dark-300 text-sm font-medium mb-2">
                    Nama Bank
                  </label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    required
                    placeholder="BCA / Mandiri / BRI"
                    className="w-full px-4 py-3 rounded-xl bg-dark-700/50 border border-dark-600/50 text-white placeholder-dark-500 focus:outline-none focus:border-barber-400/50"
                  />
                </div>

                <div>
                  <label className="block text-dark-300 text-sm font-medium mb-2">
                    Nomor Rekening
                  </label>
                  <input
                    type="text"
                    value={bankAccount}
                    onChange={(e) => setBankAccount(e.target.value)}
                    required
                    placeholder="1234567890"
                    className="w-full px-4 py-3 rounded-xl bg-dark-700/50 border border-dark-600/50 text-white placeholder-dark-500 focus:outline-none focus:border-barber-400/50"
                  />
                </div>

                <div>
                  <label className="block text-dark-300 text-sm font-medium mb-2">
                    Nama Pemilik Rekening
                  </label>
                  <input
                    type="text"
                    value={bankHolder}
                    onChange={(e) => setBankHolder(e.target.value)}
                    required
                    placeholder="NAMA SESUAI REKENING"
                    className="w-full px-4 py-3 rounded-xl bg-dark-700/50 border border-dark-600/50 text-white placeholder-dark-500 focus:outline-none focus:border-barber-400/50"
                  />
                </div>

                <p className="text-dark-500 text-xs">
                  Dana akan ditransfer manual oleh admin dalam 1x24 jam.
                </p>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowPayout(false)}
                    className="flex-1 py-3 rounded-xl border border-dark-600 text-dark-200 transition-colors font-semibold"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={payoutLoading}
                    className="flex-1 py-3 rounded-xl gold-gradient text-dark-900 font-bold disabled:opacity-60"
                  >
                    {payoutLoading ? "Memproses..." : "Kirim Permintaan"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
```

---

### Task 6: Barbershop Owner Referral Page (Dashboard)

**Files:**
- Create: `app/dashboard/referrals/page.tsx`

- [ ] **Step 1: Create server page**

```tsx
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { createReferralCodeForProfile, getReferralStats } from "@/lib/referral";
import OwnerReferralClient from "./OwnerReferralClient";

export const dynamic = "force-dynamic";

export default async function DashboardReferralsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: barbershop } = await supabase
    .from("barbershops")
    .select("id")
    .eq("owner_id", user.id)
    .single();

  if (!barbershop) redirect("/onboarding");

  const rc = await createReferralCodeForProfile(user.id);
  const stats = await getReferralStats(rc.id);

  return <OwnerReferralClient referrer={stats.referrer} referrals={stats.referrals} />;
}
```

- [ ] **Step 2: Create client component with payout modal (reuse ReferrerDashboard pattern)**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { requestPayout } from "@/app/referral/actions";

interface ReferrerData {
  id: string;
  code: string;
  profile_id: string | null;
  name: string | null;
  balance: number;
  total_earned: number;
  total_withdrawn: number;
}

interface ReferralRow {
  id: string;
  shop_name: string;
  status: string;
  commission: number;
  earned_at: string | null;
  created_at: string;
}

export default function OwnerReferralClient({
  referrer,
  referrals,
}: {
  referrer: ReferrerData;
  referrals: ReferralRow[];
}) {
  const router = useRouter();
  const supabase = createClient();
  const referralLink = `https://kapster.my.id?ref=${referrer.code}`;
  const [copied, setCopied] = useState(false);
  const [showPayout, setShowPayout] = useState(false);
  const [payoutMethod, setPayoutMethod] = useState("bank_transfer");
  const [bankName, setBankName] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [bankHolder, setBankHolder] = useState("");
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [payoutError, setPayoutError] = useState("");
  const [payoutSuccess, setPayoutSuccess] = useState(false);

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePayout = async (e: React.FormEvent) => {
    e.preventDefault();
    setPayoutLoading(true);
    setPayoutError("");

    const form = new FormData();
    form.set("referral_code_id", referrer.id);
    form.set("amount", String(referrer.balance));
    form.set("method", payoutMethod);
    form.set("bank_info", JSON.stringify({
      bank: bankName,
      account: bankAccount,
      holder: bankHolder,
    }));

    const res = await requestPayout(form);
    if (res.error) {
      setPayoutError(res.error);
      setPayoutLoading(false);
      return;
    }

    setPayoutSuccess(true);
    setPayoutLoading(false);
  };

  const pendingCount = referrals.filter((r) => r.status === "pending").length;
  const earnedCount = referrals.filter((r) => r.status === "earned").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Referral</h1>
        <p className="text-dark-400 text-sm">Ajak barbershop lain dan dapatkan komisi</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-dark-800/50 border border-dark-700/30 rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold text-white">{referrals.length}</p>
          <p className="text-dark-400 text-xs mt-1">Total Diajak</p>
        </div>
        <div className="bg-dark-800/50 border border-dark-700/30 rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold text-barber-400">{earnedCount}</p>
          <p className="text-dark-400 text-xs mt-1">Komisi Didapat</p>
        </div>
        <div className="bg-dark-800/50 border border-dark-700/30 rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold text-dark-400">{pendingCount}</p>
          <p className="text-dark-400 text-xs mt-1">Menunggu</p>
        </div>
      </div>

      {/* Balance + Link */}
      <div className="bg-gradient-to-r from-barber-400/10 to-barber-600/10 border border-barber-400/20 rounded-2xl p-6">
        <p className="text-dark-400 text-sm">Saldo Komisi</p>
        <p className="font-display text-3xl font-bold text-white mt-1">
          Rp{referrer.balance.toLocaleString("id-ID")}
        </p>
        <button
          onClick={() => setShowPayout(true)}
          disabled={referrer.balance < 25000}
          className="mt-3 px-5 py-2 rounded-xl gold-gradient text-dark-900 font-semibold text-sm disabled:opacity-60 disabled:cursor-not-allowed"
        >
          Tarik Saldo (min Rp25.000)
        </button>
      </div>

      <div className="bg-dark-800/50 border border-dark-700/30 rounded-2xl p-6">
        <label className="block text-dark-300 text-sm font-medium mb-2">
          Link Referral
        </label>
        <div className="flex items-center gap-2">
          <input
            readOnly
            value={referralLink}
            className="flex-1 px-4 py-3 rounded-xl bg-dark-700/50 border border-dark-600/50 text-white text-sm"
          />
          <button
            onClick={copyLink}
            className="px-4 py-3 rounded-xl gold-gradient text-dark-900 font-semibold text-sm whitespace-nowrap"
          >
            {copied ? "Tersalin!" : "Salin"}
          </button>
        </div>
      </div>

      {/* Referral List */}
      <div className="bg-dark-800/50 border border-dark-700/30 rounded-2xl p-6">
        <h2 className="font-semibold text-white mb-4">Riwayat Referral</h2>
        {referrals.length === 0 ? (
          <p className="text-dark-500 text-sm">Belum ada referral. Bagikan link kamu ke pemilik barbershop lain!</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dark-700/30 text-dark-400 text-left">
                  <th className="pb-3 font-medium">Barbershop</th>
                  <th className="pb-3 font-medium">Tanggal</th>
                  <th className="pb-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {referrals.map((ref) => (
                  <tr key={ref.id} className="border-b border-dark-700/30">
                    <td className="py-3 text-white">{ref.shop_name}</td>
                    <td className="py-3 text-dark-400">{new Date(ref.created_at).toLocaleDateString("id-ID")}</td>
                    <td className="py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                        ref.status === "earned"
                          ? "bg-green-500/10 text-green-400"
                          : ref.status === "paid"
                            ? "bg-blue-500/10 text-blue-400"
                            : "bg-dark-700 text-dark-400"
                      }`}>
                        {ref.status === "earned"
                          ? `Rp${ref.commission.toLocaleString("id-ID")}`
                          : ref.status === "paid" ? "Ditarik" : "Menunggu"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payout Modal */}
      {showPayout && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
          <div className="bg-dark-800 w-full max-w-md rounded-2xl p-6 border border-dark-700/30">
            <h2 className="font-semibold text-white text-lg mb-4">Tarik Saldo</h2>
            {payoutSuccess ? (
              <div className="text-center py-8">
                <p className="text-green-400 font-semibold mb-2">Permintaan terkirim!</p>
                <p className="text-dark-400 text-sm">Admin akan memproses dalam 1x24 jam.</p>
                <button
                  onClick={() => { setShowPayout(false); setPayoutSuccess(false); router.refresh(); }}
                  className="mt-4 px-6 py-2.5 rounded-xl gold-gradient text-dark-900 font-semibold text-sm"
                >
                  Tutup
                </button>
              </div>
            ) : (
              <form onSubmit={handlePayout} className="space-y-4">
                {payoutError && (
                  <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    {payoutError}
                  </div>
                )}
                <div>
                  <label className="block text-dark-300 text-sm font-medium mb-2">Jumlah</label>
                  <input type="number" value={referrer.balance} readOnly className="w-full px-4 py-3 rounded-xl bg-dark-700/50 border border-dark-600/50 text-white" />
                </div>
                <div>
                  <label className="block text-dark-300 text-sm font-medium mb-2">Metode</label>
                  <select value={payoutMethod} onChange={(e) => setPayoutMethod(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-dark-700/50 border border-dark-600/50 text-white">
                    <option value="bank_transfer">Transfer Bank</option>
                    <option value="subscription_offset">Potong Subscription</option>
                  </select>
                </div>
                {payoutMethod === "bank_transfer" && (
                  <>
                    <div>
                      <label className="block text-dark-300 text-sm font-medium mb-2">Nama Bank</label>
                      <input type="text" value={bankName} onChange={(e) => setBankName(e.target.value)} required placeholder="BCA / Mandiri / BRI" className="w-full px-4 py-3 rounded-xl bg-dark-700/50 border border-dark-600/50 text-white placeholder-dark-500 focus:outline-none focus:border-barber-400/50" />
                    </div>
                    <div>
                      <label className="block text-dark-300 text-sm font-medium mb-2">Nomor Rekening</label>
                      <input type="text" value={bankAccount} onChange={(e) => setBankAccount(e.target.value)} required placeholder="1234567890" className="w-full px-4 py-3 rounded-xl bg-dark-700/50 border border-dark-600/50 text-white placeholder-dark-500 focus:outline-none focus:border-barber-400/50" />
                    </div>
                    <div>
                      <label className="block text-dark-300 text-sm font-medium mb-2">Nama Pemilik</label>
                      <input type="text" value={bankHolder} onChange={(e) => setBankHolder(e.target.value)} required placeholder="NAMA SESUAI REKENING" className="w-full px-4 py-3 rounded-xl bg-dark-700/50 border border-dark-600/50 text-white placeholder-dark-500 focus:outline-none focus:border-barber-400/50" />
                    </div>
                  </>
                )}
                {payoutMethod === "subscription_offset" && (
                  <div className="p-4 rounded-xl bg-barber-400/5 border border-barber-400/15">
                    <p className="text-dark-300 text-sm">Komisi Rp{referrer.balance.toLocaleString("id-ID")} akan dipotongkan dari subscription bulan depan.</p>
                  </div>
                )}
                <div className="flex gap-3">
                  <button type="button" onClick={() => setShowPayout(false)} className="flex-1 py-3 rounded-xl border border-dark-600 text-dark-200 transition-colors font-semibold">Batal</button>
                  <button type="submit" disabled={payoutLoading} className="flex-1 py-3 rounded-xl gold-gradient text-dark-900 font-bold disabled:opacity-60">
                    {payoutLoading ? "Memproses..." : "Kirim Permintaan"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
```

---

### Task 7: Admin Referral Page

**Files:**
- Create: `app/admin/referrals/page.tsx`
- Create: `app/admin/referrals/actions.ts`

- [ ] **Step 1: Create admin page**

```tsx
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function AdminReferralsPage() {
  const supabase = createAdminClient();

  const [rcResult, referralsResult, payoutsResult] = await Promise.all([
    supabase.from("referral_codes").select("*").order("created_at", { ascending: false }),
    supabase.from("referrals").select("*").order("created_at", { ascending: false }),
    supabase.from("payout_requests").select("*").order("requested_at", { ascending: false }),
  ]);

  const referralCodes = rcResult.data || [];
  const referrals = referralsResult.data || [];
  const payouts = payoutsResult.data || [];

  const barbershopIds = referrals.map((r) => r.barbershop_id).filter(Boolean);
  const { data: shops } = await supabase
    .from("barbershops")
    .select("id, name")
    .in("id", barbershopIds);
  const shopMap = Object.fromEntries((shops || []).map((s) => [s.id, s.name]));

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in("id", referralCodes.filter((rc) => rc.profile_id).map((rc) => rc.profile_id!));
  const profileMap = Object.fromEntries((profiles || []).map((p) => [p.id, p.full_name]));

  const totalCommissionsPaid = referralCodes.reduce((sum, rc) => sum + rc.total_withdrawn, 0);
  const totalBalance = referralCodes.reduce((sum, rc) => sum + rc.balance, 0);
  const pendingPayouts = payouts.filter((p) => p.status === "pending").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Referral Management</h1>
        <p className="text-dark-400 text-sm">Kelola referral dan payout</p>
      </div>

      {/* Overview */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-dark-800/50 border border-dark-700/30 rounded-2xl p-4">
          <p className="text-dark-400 text-xs">Total Referrer</p>
          <p className="text-2xl font-bold text-white">{referralCodes.length}</p>
        </div>
        <div className="bg-dark-800/50 border border-dark-700/30 rounded-2xl p-4">
          <p className="text-dark-400 text-xs">Total Referral</p>
          <p className="text-2xl font-bold text-white">{referrals.length}</p>
        </div>
        <div className="bg-dark-800/50 border border-dark-700/30 rounded-2xl p-4">
          <p className="text-dark-400 text-xs">Komisi Dibayar</p>
          <p className="text-2xl font-bold text-white">Rp{totalCommissionsPaid.toLocaleString("id-ID")}</p>
        </div>
        <div className="bg-dark-800/50 border border-dark-700/30 rounded-2xl p-4">
          <p className="text-dark-400 text-xs">Pending Payout</p>
          <p className="text-2xl font-bold text-barber-400">{pendingPayouts}</p>
        </div>
      </div>

      {/* Payout Requests */}
      <div className="bg-dark-800/50 border border-dark-700/30 rounded-2xl p-6">
        <h2 className="font-semibold text-white mb-4">Permintaan Payout</h2>
        {payouts.length === 0 ? (
          <p className="text-dark-500 text-sm">Belum ada permintaan payout.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dark-700/30 text-dark-400 text-left">
                  <th className="pb-3 font-medium">Referrer</th>
                  <th className="pb-3 font-medium">Jumlah</th>
                  <th className="pb-3 font-medium">Metode</th>
                  <th className="pb-3 font-medium">Tanggal</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {payouts.map((p) => {
                  const rc = referralCodes.find((r) => r.id === p.referral_code_id);
                  const name = rc?.profile_id
                    ? profileMap[rc.profile_id] || "Unknown"
                    : rc?.name || "Unknown";
                  return (
                    <tr key={p.id} className="border-b border-dark-700/30">
                      <td className="py-3 text-white">{name}</td>
                      <td className="py-3 text-white">Rp{p.amount.toLocaleString("id-ID")}</td>
                      <td className="py-3 text-dark-400">{p.method || "-"}</td>
                      <td className="py-3 text-dark-400">{new Date(p.requested_at).toLocaleDateString("id-ID")}</td>
                      <td className="py-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                          p.status === "pending" ? "bg-yellow-500/10 text-yellow-400" :
                          p.status === "paid" ? "bg-green-500/10 text-green-400" :
                          "bg-red-500/10 text-red-400"
                        }`}>{p.status}</span>
                      </td>
                      <td className="py-3">
                        {p.status === "pending" && (
                          <form action={async () => {
                            "use server";
                            const { markPayoutPaid } = await import("./actions");
                            await markPayoutPaid(p.id, p.referral_code_id, p.amount);
                          }}>
                            <button type="submit" className="px-3 py-1.5 rounded-lg bg-green-500/10 text-green-400 text-xs font-medium hover:bg-green-500/20">
                              Tandai Dibayar
                            </button>
                          </form>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Referral Codes */}
      <div className="bg-dark-800/50 border border-dark-700/30 rounded-2xl p-6">
        <h2 className="font-semibold text-white mb-4">Semua Referrer</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-dark-700/30 text-dark-400 text-left">
                <th className="pb-3 font-medium">Nama</th>
                <th className="pb-3 font-medium">Kode</th>
                <th className="pb-3 font-medium">WA</th>
                <th className="pb-3 font-medium">Saldo</th>
                <th className="pb-3 font-medium">Total Cair</th>
                <th className="pb-3 font-medium">Daftar</th>
              </tr>
            </thead>
            <tbody>
              {referralCodes.map((rc) => {
                const name = rc.profile_id ? profileMap[rc.profile_id] || "Unknown" : rc.name || "Unknown";
                const referralCount = referrals.filter((r) => r.referral_code_id === rc.id).length;
                return (
                  <tr key={rc.id} className="border-b border-dark-700/30">
                    <td className="py-3 text-white">{name}</td>
                    <td className="py-3 text-barber-400 font-mono">{rc.code}</td>
                    <td className="py-3 text-dark-400">{rc.wa_number || "-"}</td>
                    <td className="py-3 text-white">Rp{rc.balance.toLocaleString("id-ID")}</td>
                    <td className="py-3 text-white">Rp{rc.total_withdrawn.toLocaleString("id-ID")}</td>
                    <td className="py-3 text-dark-400">{referralCount} referral</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create admin server actions**

```ts
"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function markPayoutPaid(
  payoutId: string,
  referralCodeId: string,
  amount: number
) {
  const supabase = createAdminClient();

  const { error: payoutError } = await supabase
    .from("payout_requests")
    .update({ status: "paid", paid_at: new Date().toISOString() })
    .eq("id", payoutId);

  if (payoutError) throw new Error("Failed to update payout");

  const { data: rc } = await supabase
    .from("referral_codes")
    .select("balance, total_withdrawn")
    .eq("id", referralCodeId)
    .single();

  if (rc) {
    await supabase
      .from("referral_codes")
      .update({
        balance: rc.balance - amount,
        total_withdrawn: rc.total_withdrawn + amount,
      })
      .eq("id", referralCodeId);
  }

  revalidatePath("/admin/referrals");
}
```

---

### Task 8: Update Pakasir Webhook to Credit Commission

**Files:**
- Modify: `app/api/webhook/pakasir/route.ts`

- [ ] **Step 1: Add commission crediting after subscription activation**

After the subscription is upserted (around line 80), add:

```ts
import { creditReferralCommission } from "@/lib/referral";

// After subscription is created successfully (after line 80, before linking payment)
try {
  const result = await creditReferralCommission(payment.barbershop_id);
  if (result) {
    console.log(`Commission credited: Rp${result.commission} for barbershop ${payment.barbershop_id}`);
  }
} catch (err) {
  // Log but don't fail the webhook — commission can be credited manually
  console.error("Failed to credit referral commission:", err);
}
```

---

### Task 9: Update Onboarding to Check Referral Cookie

**Files:**
- Modify: `app/onboarding/page.tsx`

- [ ] **Step 1: Add cookie read and referral submission on form submit**

Add a `useEffect` to read the cookie on mount:

```ts
import { createReferralRecord } from "@/lib/referral";
// This is a client component, so we create a server action to handle the referral

// Add state:
const [referralCode, setReferralCode] = useState("");

// Add in useEffect:
useEffect(() => {
  const cookie = document.cookie
    .split("; ")
    .find((row) => row.startsWith("referrer_code="));
  if (cookie) {
    const code = decodeURIComponent(cookie.split("=")[1]);
    setReferralCode(code);
  }
}, []);
```

Add a server action file `app/onboarding/actions.ts`:

```ts
"use server";

import { getReferrerByCode, createReferralRecord } from "@/lib/referral";

export async function applyReferral(barbershopId: string, referralCode: string) {
  const referrer = await getReferrerByCode(referralCode);
  if (!referrer) return { error: "Kode referral tidak valid" };

  // Prevent self-referral
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const supabase = createAdminClient();
  const { data: shop } = await supabase
    .from("barbershops")
    .select("owner_id")
    .eq("id", barbershopId)
    .single();

  if (shop && referrer.profile_id === shop.owner_id) {
    return { error: "Tidak bisa self-referral" };
  }

  try {
    await createReferralRecord(referrer.id, barbershopId);
    return { success: true };
  } catch {
    return { error: "Gagal menyimpan referral" };
  }
}
```

In `app/onboarding/page.tsx`, after the barbershop is created (after line 116), add:

```ts
// After shop is created and services inserted, submit referral
if (referralCode) {
  const { applyReferral } = await import("@/app/onboarding/actions");
  await applyReferral(shop.id, referralCode);
}
```

Show the referral discount banner in the form. Add after the progress bar (after line 162):

```tsx
{referralCode && (
  <div className="p-4 rounded-xl bg-barber-400/5 border border-barber-400/15 text-center">
    <p className="text-barber-400 font-semibold text-sm">
      🎉 Kamu diundang! Diskon 25% bulan pertama — bayar Rp7.500 saja!
    </p>
  </div>
)}
```

---

### Note: TypeScript Types

Since `lib/supabase/types.ts` is auto-generated, create a supplemental type file for the new tables:

**File:** `lib/referral-types.ts`

```ts
// Supplemental types for referral/affiliate tables (not yet in auto-generated types)

export interface ReferralCodeRow {
  id: string;
  profile_id: string | null;
  name: string | null;
  wa_number: string | null;
  code: string;
  access_token: string;
  balance: number;
  total_earned: number;
  total_withdrawn: number;
  created_at: string;
}

export interface ReferralRow {
  id: string;
  referral_code_id: string;
  barbershop_id: string;
  status: "pending" | "earned" | "paid";
  commission: number;
  earned_at: string | null;
  paid_at: string | null;
  created_at: string;
}

export interface PayoutRequestRow {
  id: string;
  referral_code_id: string;
  amount: number;
  method: string | null;
  bank_info: Record<string, string> | null;
  status: "pending" | "paid" | "cancelled";
  notes: string | null;
  requested_at: string;
  paid_at: string | null;
}
```

Import these types in files that use the new tables instead of the auto-generated `Database` type.

---

### Task 10: Add Sidebar Link for Dashboard Referrals

**Files:**
- Modify: `components/admin/Sidebar.tsx` (or wherever the dashboard sidebar is defined)

- [ ] **Step 1: Add "Referral" to dashboard nav items**

Find the `navItems` array in the dashboard sidebar (likely `components/dashboard/Sidebar.tsx` based on the pattern) and add:

```ts
{ href: "/dashboard/referrals", label: "Referral", icon: "M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" },
```

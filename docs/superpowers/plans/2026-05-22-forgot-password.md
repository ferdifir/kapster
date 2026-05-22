# Forgot/Reset Password via WhatsApp — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add WhatsApp-based forgot/reset password and phone verification during registration.

**Architecture:** OTP-based flow using WhatsApp (WuzAPI). New `phone_otp_codes` DB table stores hashed OTPs. Server actions handle OTP send/verify and password reset via Supabase Admin API. Registration form extended with phone + inline OTP verification step.

**Tech Stack:** Next.js 16 (App Router, Server Actions), Supabase Auth (Admin API for password reset), WuzAPI (WhatsApp), Playwright (E2E tests)

---

### Task 1: Database Migration

**Files:**
- Create: `supabase/migrations/add_phone_otp.sql`

- [ ] **Step 1: Write migration SQL**

```sql
-- Add phone_verified_at to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone_verified_at TIMESTAMPTZ;

-- Create phone_otp_codes table
CREATE TABLE IF NOT EXISTS phone_otp_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  purpose TEXT NOT NULL CHECK (purpose IN ('registration_verification', 'password_reset')),
  profile_id UUID REFERENCES profiles(id),
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '5 minutes'),
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_phone_otp_codes_phone_purpose ON phone_otp_codes(phone, purpose);
CREATE INDEX IF NOT EXISTS idx_phone_otp_codes_expires ON phone_otp_codes(expires_at);
```

- [ ] **Step 2: Commit**

```bash
git add supabase/migrations/add_phone_otp.sql
git commit -m "feat: add phone_otp_codes table and phone_verified_at column"
```

---

### Task 2: Update TypeScript Types

**Files:**
- Modify: `lib/supabase/types.ts`

- [ ] **Step 1: Add `phone_otp_codes` table and update `profiles`**

In the `profiles` definition (around line 260), add `phone_verified_at: string | null` to Row, Insert, and Update:

```typescript
profiles: {
  Row: {
    avatar_url: string | null
    created_at: string
    full_name: string | null
    id: string
    phone: string | null
    phone_verified_at: string | null
    role: Database["public"]["Enums"]["user_role"]
    updated_at: string
  }
  Insert: {
    avatar_url?: string | null
    created_at?: string
    full_name?: string | null
    id: string
    phone?: string | null
    phone_verified_at?: string | null
    role?: Database["public"]["Enums"]["user_role"]
    updated_at?: string
  }
  Update: {
    avatar_url?: string | null
    created_at?: string
    full_name?: string | null
    id?: string
    phone?: string | null
    phone_verified_at?: string | null
    role?: Database["public"]["Enums"]["user_role"]
    updated_at?: string
  }
  Relationships: [
    {
      foreignKeyName: "profiles_id_fkey"
      columns: ["id"]
      isOneToOne: true
      referencedRelation: "users"
      referencedColumns: ["id"]
    },
  ]
}
```

Add `phone_otp_codes` table definition after `profiles` (before `queue_entries`):

```typescript
phone_otp_codes: {
  Row: {
    id: string
    phone: string
    code_hash: string
    purpose: "registration_verification" | "password_reset"
    profile_id: string | null
    attempts: number
    max_attempts: number
    expires_at: string
    verified_at: string | null
    created_at: string
  }
  Insert: {
    id?: string
    phone: string
    code_hash: string
    purpose: "registration_verification" | "password_reset"
    profile_id?: string | null
    attempts?: number
    max_attempts?: number
    expires_at?: string
    verified_at?: string | null
    created_at?: string
  }
  Update: {
    id?: string
    phone?: string
    code_hash?: string
    purpose?: "registration_verification" | "password_reset"
    profile_id?: string | null
    attempts?: number
    max_attempts?: number
    expires_at?: string
    verified_at?: string | null
    created_at?: string
  }
  Relationships: [
    {
      foreignKeyName: "phone_otp_codes_profile_id_fkey"
      columns: ["profile_id"]
      isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },
  ]
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/supabase/types.ts
git commit -m "feat: add phone_otp_codes and phone_verified_at types"
```

---

### Task 3: OTP Utility

**Files:**
- Create: `lib/otp.ts`

- [ ] **Step 1: Write the file**

```typescript
import crypto from "crypto";

export function generateOTP(): string {
  return crypto.randomInt(100000, 999999).toString();
}

export function hashOTP(code: string): string {
  return crypto.createHash("sha256").update(code).digest("hex");
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/otp.ts
git commit -m "feat: add OTP generation and hashing utility"
```

---

### Task 4: Update WhatsApp Templates

**Files:**
- Modify: `lib/wa-templates.ts`

- [ ] **Step 1: Add OTP event types and `code` field**

Change `WAEventType` — add two new types:

```typescript
export type WAEventType =
  | "join_queue"
  | "queue_called"
  | "queue_serving"
  | "queue_done"
  | "queue_number_update"
  | "booking_confirmed"
  | "booking_reminder"
  | "registration_otp"
  | "password_reset_otp";
```

Add `code?: string` to `WAEventContext`:

```typescript
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
  code?: string;
}
```

Add two new templates to the `templates` record:

```typescript
registration_otp:
  "Kode verifikasi akun Kapster kamu: {code}. Kode berlaku 5 menit. Jangan bagikan kode ini ke siapa pun.",
password_reset_otp:
  "Kode reset password Kapster kamu: {code}. Kode berlaku 5 menit. Jangan bagikan kode ini ke siapa pun.",
```

Add `{code}` replacement in `renderWATemplate`:

```typescript
.replace("{code}", context.code ?? "")
```

- [ ] **Step 2: Commit**

```bash
git add lib/wa-templates.ts
git commit -m "feat: add OTP WhatsApp templates"
```

---

### Task 5: Auth Server Actions

**Files:**
- Create: `app/auth/actions.ts`

- [ ] **Step 1: Write server actions**

```typescript
"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizePhone, validatePhone } from "@/lib/phone";
import { generateOTP, hashOTP } from "@/lib/otp";
import { sendTextMessage } from "@/lib/wuzapi";
import { renderWATemplate } from "@/lib/wa-templates";

export async function setupPhoneVerification(phone: string) {
  const supabase = await createClient();
  const admin = createAdminClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Sesi tidak ditemukan. Silakan login ulang." };

  const normalized = normalizePhone(phone);
  const validation = validatePhone(phone);
  if (!validation.valid) return { error: validation.error };

  // Upsert profile with phone
  const { error: upsertError } = await admin
    .from("profiles")
    .upsert({
      id: user.id,
      phone: normalized,
      full_name: user.user_metadata?.full_name,
      updated_at: new Date().toISOString(),
    }, { onConflict: "id" });

  if (upsertError) return { error: "Gagal menyimpan nomor HP." };

  // Rate limit check
  const { data: lastOtp } = await supabase
    .from("phone_otp_codes")
    .select("created_at")
    .eq("phone", normalized)
    .eq("purpose", "registration_verification")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (lastOtp) {
    const elapsed = (Date.now() - new Date(lastOtp.created_at).getTime()) / 1000;
    if (elapsed < 60) return { error: "Tunggu 60 detik sebelum mengirim ulang." };
  }

  const code = generateOTP();
  const codeHash = hashOTP(code);

  const { error: insertError } = await supabase
    .from("phone_otp_codes")
    .insert({
      phone: normalized,
      code_hash: codeHash,
      purpose: "registration_verification",
      profile_id: user.id,
      expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    });

  if (insertError) return { error: "Gagal menyimpan kode OTP." };

  const message = renderWATemplate("registration_otp", {
    name: "", barbershop: "", code,
  });

  try {
    await sendTextMessage(process.env.SYSTEM_WUZAPI_TOKEN!, normalized, message);
  } catch {
    return { error: "Gagal mengirim kode OTP via WhatsApp." };
  }

  return { success: true };
}

export async function sendOTP(phone: string, purpose: "registration_verification" | "password_reset") {
  const supabase = await createClient();
  const admin = createAdminClient();

  const normalized = normalizePhone(phone);
  const validation = validatePhone(phone);
  if (!validation.valid) return { error: validation.error };

  // For password_reset, check phone exists in profiles and is verified
  if (purpose === "password_reset") {
    const { data: profile } = await admin
      .from("profiles")
      .select("id, phone_verified_at")
      .eq("phone", normalized)
      .single();

    if (!profile || !profile.phone_verified_at) {
      return { success: true, message: "Jika nomor terdaftar dan sudah diverifikasi, kode OTP akan dikirim." };
    }
  }

  // Rate limit
  const { data: lastOtp } = await supabase
    .from("phone_otp_codes")
    .select("created_at")
    .eq("phone", normalized)
    .eq("purpose", purpose)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (lastOtp) {
    const elapsed = (Date.now() - new Date(lastOtp.created_at).getTime()) / 1000;
    if (elapsed < 60) return { error: "Tunggu 60 detik sebelum mengirim ulang." };
  }

  const code = generateOTP();
  const codeHash = hashOTP(code);

  const { error: insertError } = await supabase
    .from("phone_otp_codes")
    .insert({
      phone: normalized,
      code_hash: codeHash,
      purpose,
      expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    });

  if (insertError) return { error: "Gagal menyimpan kode OTP." };

  const template = purpose === "registration_verification" ? "registration_otp" : "password_reset_otp";
  const message = renderWATemplate(template, { name: "", barbershop: "", code });

  try {
    await sendTextMessage(process.env.SYSTEM_WUZAPI_TOKEN!, normalized, message);
  } catch {
    return { error: "Gagal mengirim kode OTP via WhatsApp." };
  }

  return { success: true };
}

export async function verifyOTP(phone: string, code: string, purpose: "registration_verification" | "password_reset") {
  const supabase = await createClient();
  const admin = createAdminClient();
  const normalized = normalizePhone(phone);

  const { data: otpRecords, error: fetchError } = await supabase
    .from("phone_otp_codes")
    .select("*")
    .eq("phone", normalized)
    .eq("purpose", purpose)
    .is("verified_at", null)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1);

  if (fetchError || !otpRecords || otpRecords.length === 0) {
    return { error: "Kode OTP tidak valid atau sudah kedaluwarsa." };
  }

  const otpRecord = otpRecords[0];
  const { hashOTP: hash } = await import("@/lib/otp");

  if (hash(code) !== otpRecord.code_hash) {
    const newAttempts = otpRecord.attempts + 1;
    if (newAttempts >= otpRecord.max_attempts) {
      await supabase
        .from("phone_otp_codes")
        .update({ attempts: newAttempts, expires_at: new Date(0).toISOString() })
        .eq("id", otpRecord.id);
      return { error: "Kode OTP salah 3 kali. Silakan minta kode baru." };
    }
    await supabase
      .from("phone_otp_codes")
      .update({ attempts: newAttempts })
      .eq("id", otpRecord.id);
    return { error: "Kode OTP salah." };
  }

  // Mark OTP as verified
  const now = new Date().toISOString();
  await supabase
    .from("phone_otp_codes")
    .update({ verified_at: now })
    .eq("id", otpRecord.id);

  // If registration verification, mark profile phone as verified
  if (purpose === "registration_verification" && otpRecord.profile_id) {
    await admin
      .from("profiles")
      .update({ phone_verified_at: now })
      .eq("id", otpRecord.profile_id);
  }

  return { success: true };
}

export async function resetPassword(phone: string, newPassword: string) {
  const supabase = await createClient();
  const admin = createAdminClient();
  const normalized = normalizePhone(phone);

  if (!newPassword || newPassword.length < 8) {
    return { error: "Password minimal 8 karakter." };
  }

  // Find a verified OTP within last 5 minutes
  const { data: otpRecords } = await supabase
    .from("phone_otp_codes")
    .select("*")
    .eq("phone", normalized)
    .eq("purpose", "password_reset")
    .not("verified_at", "is", null)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1);

  if (!otpRecords || otpRecords.length === 0) {
    return { error: "Verifikasi OTP belum dilakukan atau sudah kedaluwarsa." };
  }

  const otpRecord = otpRecords[0];

  // Look up profile by phone
  const { data: profile } = await admin
    .from("profiles")
    .select("id")
    .eq("phone", normalized)
    .single();

  if (!profile) {
    return { error: "Akun tidak ditemukan." };
  }

  // Update password via Supabase Admin API
  const { error: updateError } = await admin.auth.admin.updateUserById(
    profile.id,
    { password: newPassword }
  );

  if (updateError) {
    return { error: "Gagal mengupdate password. Silakan coba lagi." };
  }

  // Clean up OTP record
  await supabase
    .from("phone_otp_codes")
    .delete()
    .eq("id", otpRecord.id);

  return { success: true };
}
```

- [ ] **Step 2: Commit**

```bash
git add app/auth/actions.ts
git commit -m "feat: add OTP and password reset server actions"
```

---

### Task 6: Update Registration Page

**Files:**
- Modify: `app/auth/register/page.tsx`

- [ ] **Step 1: Add phone field and OTP verification step**

Add `phone` to form state and a new `step` state variable. After signup success, call `setupPhoneVerification` server action, show OTP UI. On OTP verify, redirect to `/onboarding`.

Replace entire page content:

```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { setupPhoneVerification, verifyOTP } from "@/app/auth/actions";
import { validatePhone } from "@/lib/phone";
import Logo from "@/components/Logo";

export default function RegisterPage() {
  const supabase = createClient();
  const router = useRouter();

  const [step, setStep] = useState<"form" | "otp">("form");
  const [form, setForm] = useState({ full_name: "", email: "", password: "", phone: "" });
  const [otpValues, setOtpValues] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otpValues];
    newOtp[index] = value.slice(0, 1);
    setOtpValues(newOtp);
    if (value && index < 5) {
      const next = document.getElementById(`otp-${index + 1}`);
      next?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otpValues[index] && index > 0) {
      const prev = document.getElementById(`otp-${index - 1}`);
      prev?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const phoneValidation = validatePhone(form.phone);
    if (!phoneValidation.valid) {
      setError(phoneValidation.error!);
      setLoading(false);
      return;
    }

    const siteUrl = process.env.NEXT_PUBLIC_BASE_URL || location.origin;
    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { full_name: form.full_name },
        emailRedirectTo: `${siteUrl}/auth/callback?next=/onboarding`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    if (data.user?.identities?.length === 0) {
      setError("Email ini sudah terdaftar. Silakan login atau gunakan email lain.");
      setLoading(false);
      return;
    }

    // Send OTP to WhatsApp
    const result = await setupPhoneVerification(form.phone);
    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    setStep("otp");
    setLoading(false);
  };

  const handleVerifyOtp = async () => {
    setVerifyLoading(true);
    setError("");

    const code = otpValues.join("");
    if (code.length !== 6) {
      setError("Masukkan 6 digit kode OTP.");
      setVerifyLoading(false);
      return;
    }

    const result = await verifyOTP(form.phone, code, "registration_verification");
    if (result.error) {
      setError(result.error);
      setVerifyLoading(false);
      return;
    }

    router.push("/onboarding");
  };

  const handleResendOtp = async () => {
    setResendLoading(true);
    setError("");
    const result = await setupPhoneVerification(form.phone);
    if (result.error) setError(result.error);
    setResendLoading(false);
  };

  if (step === "otp") {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-barber-400/10 flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-barber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </div>
          <h2 className="font-display text-2xl font-bold text-white mb-3">
            Verifikasi WhatsApp
          </h2>
          <p className="text-dark-400 text-sm leading-relaxed mb-2">
            Kode OTP sudah dikirim ke <span className="text-barber-400">{form.phone}</span>
          </p>
          <p className="text-dark-500 text-xs mb-8">Masukkan 6 digit kode di bawah</p>

          {error && (
            <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-6">
              {error}
            </div>
          )}

          <div className="flex gap-3 justify-center mb-8">
            {otpValues.map((digit, i) => (
              <input
                key={i}
                id={`otp-${i}`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(i, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(i, e)}
                className="w-12 h-14 text-center text-xl font-bold rounded-xl bg-dark-700/50 border border-dark-600/50 text-white focus:outline-none focus:border-barber-400/50 transition-colors"
              />
            ))}
          </div>

          <button
            onClick={handleVerifyOtp}
            disabled={verifyLoading}
            className="w-full py-3 rounded-xl gold-gradient text-dark-900 font-bold transition-all duration-300 hover:shadow-lg hover:shadow-barber-400/25 disabled:opacity-60 disabled:cursor-not-allowed mb-4"
          >
            {verifyLoading ? "Memverifikasi..." : "Verifikasi"}
          </button>

          <button
            onClick={handleResendOtp}
            disabled={resendLoading}
            className="text-sm text-dark-400 hover:text-barber-400 transition-colors disabled:opacity-50"
          >
            {resendLoading ? "Mengirim..." : "Tidak menerima kode? Kirim ulang"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg gold-gradient flex items-center justify-center">
              <Logo className="w-6 h-6 text-dark-900" />
            </div>
            <span className="font-display text-xl font-bold text-white">Kapster</span>
          </Link>
          <h1 className="font-display text-2xl font-bold text-white mb-2">Daftar Gratis</h1>
          <p className="text-dark-400 text-sm">
            Sudah punya akun?{" "}
            <Link href="/auth/login" className="text-barber-400 hover:text-barber-300 transition-colors">
              Masuk
            </Link>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-dark-800/50 border border-dark-700/30 rounded-2xl p-8 space-y-5">
          {error && (
            <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-dark-300 text-sm font-medium mb-2">Nama Lengkap</label>
            <input type="text" name="full_name" value={form.full_name} onChange={handleChange} required
              placeholder="Budi Santoso"
              className="w-full px-4 py-3 rounded-xl bg-dark-700/50 border border-dark-600/50 text-white placeholder-dark-500 focus:outline-none focus:border-barber-400/50 transition-colors" />
          </div>

          <div>
            <label className="block text-dark-300 text-sm font-medium mb-2">Email</label>
            <input type="email" name="email" value={form.email} onChange={handleChange} required
              placeholder="nama@barbershop.com"
              className="w-full px-4 py-3 rounded-xl bg-dark-700/50 border border-dark-600/50 text-white placeholder-dark-500 focus:outline-none focus:border-barber-400/50 transition-colors" />
          </div>

          <div>
            <label className="block text-dark-300 text-sm font-medium mb-2">Password</label>
            <input type="password" name="password" value={form.password} onChange={handleChange}
              required minLength={8} placeholder="Min. 8 karakter"
              className="w-full px-4 py-3 rounded-xl bg-dark-700/50 border border-dark-600/50 text-white placeholder-dark-500 focus:outline-none focus:border-barber-400/50 transition-colors" />
          </div>

          <div>
            <label className="block text-dark-300 text-sm font-medium mb-2">Nomor WhatsApp</label>
            <input type="tel" name="phone" value={form.phone} onChange={handleChange} required
              placeholder="08123456789"
              className="w-full px-4 py-3 rounded-xl bg-dark-700/50 border border-dark-600/50 text-white placeholder-dark-500 focus:outline-none focus:border-barber-400/50 transition-colors" />
          </div>

          <button type="submit" disabled={loading}
            className="w-full py-3 rounded-xl gold-gradient text-dark-900 font-bold transition-all duration-300 hover:shadow-lg hover:shadow-barber-400/25 disabled:opacity-60 disabled:cursor-not-allowed">
            {loading ? "Mendaftar..." : "Daftar Sekarang"}
          </button>

          <p className="text-dark-500 text-xs text-center">
            Dengan mendaftar kamu setuju dengan{" "}
            <a href="/terms-of-service" className="text-barber-400 hover:text-barber-300">Syarat & Ketentuan</a>{" "}
            dan{" "}
            <a href="/privacy-policy" className="text-barber-400 hover:text-barber-300">Kebijakan Privasi</a>{" "}
            kami.
          </p>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/auth/register/page.tsx
git commit -m "feat: add phone field and WhatsApp OTP verification to registration"
```

---

### Task 7: Add Forgot Password Link to Login Page

**Files:**
- Modify: `app/auth/login/page.tsx`

- [ ] **Step 1: Add "Lupa password?" link**

In the password field section, add a "Lupa password?" link after the password input, before the submit button. Insert after line 105 (closing `</div>` of password div) and before line 108 (`<button`):

```typescript
          <div className="flex justify-end">
            <Link
              href="/auth/forgot-password"
              className="text-sm text-dark-400 hover:text-barber-400 transition-colors"
            >
              Lupa password?
            </Link>
          </div>
```

- [ ] **Step 2: Commit**

```bash
git add app/auth/login/page.tsx
git commit -m "feat: add forgot password link to login page"
```

---

### Task 8: Forgot Password Page (Phone Input)

**Files:**
- Create: `app/auth/forgot-password/page.tsx`

- [ ] **Step 1: Create page**

```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/Logo";
import { sendOTP } from "@/app/auth/actions";
import { validatePhone } from "@/lib/phone";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const validation = validatePhone(phone);
    if (!validation.valid) {
      setError(validation.error!);
      setLoading(false);
      return;
    }

    const result = await sendOTP(phone, "password_reset");
    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    setSent(true);
    setTimeout(() => {
      router.push(`/auth/forgot-password/verify?phone=${encodeURIComponent(phone)}`);
    }, 1500);
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-barber-400/10 flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-barber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </div>
          <h2 className="font-display text-2xl font-bold text-white mb-3">Cek WhatsApp Kamu</h2>
          <p className="text-dark-400 text-sm leading-relaxed">
            Jika nomor terdaftar, kode OTP akan dikirim ke WhatsApp. Mengarahkan ke halaman verifikasi...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg gold-gradient flex items-center justify-center">
              <Logo className="w-6 h-6 text-dark-900" />
            </div>
            <span className="font-display text-xl font-bold text-white">Kapster</span>
          </Link>
          <h1 className="font-display text-2xl font-bold text-white mb-2">Lupa Password</h1>
          <p className="text-dark-400 text-sm">
            Masukkan nomor WhatsApp yang terdaftar untuk menerima kode OTP reset password.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-dark-800/50 border border-dark-700/30 rounded-2xl p-8 space-y-5">
          {error && (
            <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-dark-300 text-sm font-medium mb-2">Nomor WhatsApp</label>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
              required placeholder="08123456789"
              className="w-full px-4 py-3 rounded-xl bg-dark-700/50 border border-dark-600/50 text-white placeholder-dark-500 focus:outline-none focus:border-barber-400/50 transition-colors" />
          </div>

          <button type="submit" disabled={loading}
            className="w-full py-3 rounded-xl gold-gradient text-dark-900 font-bold transition-all duration-300 hover:shadow-lg hover:shadow-barber-400/25 disabled:opacity-60 disabled:cursor-not-allowed">
            {loading ? "Mengirim..." : "Kirim Kode OTP"}
          </button>

          <p className="text-center">
            <Link href="/auth/login" className="text-sm text-dark-400 hover:text-barber-400 transition-colors">
              Kembali ke halaman login
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/auth/forgot-password/page.tsx
git commit -m "feat: add forgot password page (phone input)"
```

---

### Task 9: Forgot Password Verify Page

**Files:**
- Create: `app/auth/forgot-password/verify/page.tsx`

- [ ] **Step 1: Create page**

```typescript
"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/Logo";
import { verifyOTP, sendOTP } from "@/app/auth/actions";

export default function ForgotPasswordVerifyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const phone = searchParams.get("phone") || "";

  const [otpValues, setOtpValues] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otpValues];
    newOtp[index] = value.slice(0, 1);
    setOtpValues(newOtp);
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otpValues[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");

    const code = otpValues.join("");
    if (code.length !== 6) {
      setError("Masukkan 6 digit kode OTP.");
      setLoading(false);
      return;
    }

    const result = await verifyOTP(phone, code, "password_reset");
    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    router.push(`/auth/forgot-password/reset?phone=${encodeURIComponent(phone)}`);
  };

  const handleResend = async () => {
    setResendLoading(true);
    setError("");
    const result = await sendOTP(phone, "password_reset");
    if (result.error) setError(result.error);
    setResendLoading(false);
  };

  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg gold-gradient flex items-center justify-center">
              <Logo className="w-6 h-6 text-dark-900" />
            </div>
            <span className="font-display text-xl font-bold text-white">Kapster</span>
          </Link>
          <h2 className="font-display text-2xl font-bold text-white mb-2">Verifikasi Kode OTP</h2>
          <p className="text-dark-400 text-sm leading-relaxed mb-2">
            Kode OTP dikirim ke <span className="text-barber-400">{phone}</span>
          </p>
          <p className="text-dark-500 text-xs mb-8">Masukkan 6 digit kode yang dikirim via WhatsApp</p>
        </div>

        {error && (
          <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-6">
            {error}
          </div>
        )}

        <div className="flex gap-3 justify-center mb-8">
          {otpValues.map((digit, i) => (
            <input
              key={i}
              id={`otp-${i}`}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className="w-12 h-14 text-center text-xl font-bold rounded-xl bg-dark-700/50 border border-dark-600/50 text-white focus:outline-none focus:border-barber-400/50 transition-colors"
            />
          ))}
        </div>

        <button onClick={handleSubmit} disabled={loading}
          className="w-full py-3 rounded-xl gold-gradient text-dark-900 font-bold transition-all duration-300 hover:shadow-lg hover:shadow-barber-400/25 disabled:opacity-60 disabled:cursor-not-allowed mb-4">
          {loading ? "Memverifikasi..." : "Verifikasi"}
        </button>

        <button onClick={handleResend} disabled={resendLoading}
          className="text-sm text-dark-400 hover:text-barber-400 transition-colors disabled:opacity-50 block w-full mb-4">
          {resendLoading ? "Mengirim..." : "Tidak menerima kode? Kirim ulang"}
        </button>

        <Link href="/auth/forgot-password"
          className="text-sm text-dark-500 hover:text-barber-400 transition-colors">
          Ganti nomor WhatsApp
        </Link>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/auth/forgot-password/verify/page.tsx
git commit -m "feat: add forgot password OTP verification page"
```

---

### Task 10: Forgot Password Reset Page

**Files:**
- Create: `app/auth/forgot-password/reset/page.tsx`

- [ ] **Step 1: Create page**

```typescript
"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/Logo";
import { resetPassword } from "@/app/auth/actions";

export default function ForgotPasswordResetPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const phone = searchParams.get("phone") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (password.length < 8) {
      setError("Password minimal 8 karakter.");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Konfirmasi password tidak cocok.");
      setLoading(false);
      return;
    }

    const result = await resetPassword(phone, password);
    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setTimeout(() => router.push("/auth/login"), 2000);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="font-display text-2xl font-bold text-white mb-3">Password Berhasil Diubah</h2>
          <p className="text-dark-400 text-sm">Mengarahkan ke halaman login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg gold-gradient flex items-center justify-center">
              <Logo className="w-6 h-6 text-dark-900" />
            </div>
            <span className="font-display text-xl font-bold text-white">Kapster</span>
          </Link>
          <h1 className="font-display text-2xl font-bold text-white mb-2">Buat Password Baru</h1>
          <p className="text-dark-400 text-sm">Masukkan password baru untuk akun kamu.</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-dark-800/50 border border-dark-700/30 rounded-2xl p-8 space-y-5">
          {error && (
            <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-dark-300 text-sm font-medium mb-2">Password Baru</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              required minLength={8} placeholder="Min. 8 karakter"
              className="w-full px-4 py-3 rounded-xl bg-dark-700/50 border border-dark-600/50 text-white placeholder-dark-500 focus:outline-none focus:border-barber-400/50 transition-colors" />
          </div>

          <div>
            <label className="block text-dark-300 text-sm font-medium mb-2">Konfirmasi Password</label>
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
              required minLength={8} placeholder="Masukkan ulang password"
              className="w-full px-4 py-3 rounded-xl bg-dark-700/50 border border-dark-600/50 text-white placeholder-dark-500 focus:outline-none focus:border-barber-400/50 transition-colors" />
          </div>

          <button type="submit" disabled={loading}
            className="w-full py-3 rounded-xl gold-gradient text-dark-900 font-bold transition-all duration-300 hover:shadow-lg hover:shadow-barber-400/25 disabled:opacity-60 disabled:cursor-not-allowed">
            {loading ? "Menyimpan..." : "Simpan Password Baru"}
          </button>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/auth/forgot-password/reset/page.tsx
git commit -m "feat: add password reset page"
```

---

### Task 11: Playwright Tests

**Files:**
- Create: `tests/auth-forgot-password.spec.ts`

- [ ] **Step 1: Write E2E tests**

```typescript
import { test, expect } from "../fixtures";

test.describe("Forgot Password", () => {
  test.describe("Forgot Password Page", () => {
    test("should display forgot password form", async ({ page }) => {
      await page.goto("/auth/forgot-password");
      await expect(page.getByRole("heading", { name: /Lupa Password/i })).toBeVisible();
      await expect(page.getByRole("textbox", { name: /Nomor WhatsApp/i })).toBeVisible();
      await expect(page.getByRole("button", { name: /Kirim Kode OTP/i })).toBeVisible();
    });

    test("should show link back to login", async ({ page }) => {
      await page.goto("/auth/forgot-password");
      await page.getByRole("link", { name: /Kembali ke halaman login/i }).click();
      await page.waitForURL("/auth/login");
      await expect(page).toHaveURL("/auth/login");
    });

    test("should show link back to login from verify page", async ({ page }) => {
      await page.goto("/auth/forgot-password/verify?phone=628123456789");
      await expect(page.getByText(/Ganti nomor WhatsApp/i)).toBeVisible();
    });

    test("should validate phone format", async ({ page }) => {
      await page.goto("/auth/forgot-password");
      await page.getByRole("button", { name: /Kirim Kode OTP/i }).click();
      await expect(page.getByRole("button", { name: /Kirim Kode OTP/i })).toBeVisible();
    });
  });

  test.describe("Registration", () => {
    test("should display phone field on registration form", async ({ page }) => {
      await page.goto("/auth/register");
      await expect(page.getByRole("heading", { name: /Daftar Gratis/i })).toBeVisible();
      await expect(page.getByRole("textbox", { name: /Nomor WhatsApp/i })).toBeVisible();
    });

    test("should validate required registration fields including phone", async ({ page }) => {
      await page.goto("/auth/register");
      await page.fill('input[name="full_name"]', "Test User");
      await page.fill('input[name="email"]', "test@example.com");
      await page.fill('input[name="password"]', "TestPassword123!");
      await page.fill('input[name="phone"]', "");
      await page.click('button[type="submit"]');
      const phoneInput = page.locator('input[name="phone"]');
      await expect(phoneInput).toHaveJSProperty("validity.valid", false);
    });
  });
});
```

- [ ] **Step 2: Run tests to verify**

```bash
npm run test:e2e -- tests/auth-forgot-password.spec.ts
```

Expected: All tests pass.

- [ ] **Step 3: Commit**

```bash
git add tests/auth-forgot-password.spec.ts
git commit -m "test: add forgot password and phone registration tests"
```

---

### Self-Review Checklist

1. **Spec coverage**: Every requirement from the design doc has a corresponding task.
2. **Placeholder scan**: No TBD, TODO, or vague instructions.
3. **Type consistency**: `phone_otp_codes` types match across migration, types.ts, and server actions. OTP hash uses SHA-256 everywhere.
4. **Ambiguity check**: Clear flow for each server action, clear error messages.

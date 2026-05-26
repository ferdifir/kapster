# Perbaikan Autentikasi — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all edge cases in the registration/auth flow — OTP failure, onboarding bypass without phone verification, session redirect, and services insert error handling.

**Architecture:** Four small changes across two pages (`/auth/register` and `/onboarding`) plus one server-side rebuild check. No new files, no new dependencies.

**Tech Stack:** Next.js 16 App Router, Supabase SSR, TypeScript

---

### Task 1: OTP Gagal → Tetap ke Halaman OTP (S1)

**Files:**
- Modify: `app/auth/register/page.tsx:99-107`

- [ ] **Step 1: Hapus `return` di blok error OTP**

Di `handleSubmit`, hapus `return` setelah OTP gagal biar `setStep("otp")` tetap jalan.

```typescript
// Sebelum (line 99-107):
    const result = await setupPhoneVerification(form.phone);
    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    setStep("otp");

// Sesudah:
    const result = await setupPhoneVerification(form.phone);
    if (result.error) {
      setError(result.error);
    }
    setStep("otp");
    setLoading(false);
    setResendCooldown(60);
```

- [ ] **Step 2: Verifikasi logic**

Cek bahwa `setupPhoneVerification` dipanggil oleh **handleSubmit** (line 100) dan **handleResendOtp** (line 136) — keduanya fungsi yang sama. Tidak perlu perubahan lain.

- [ ] **Step 3: Commit**

```bash
git add app/auth/register/page.tsx
git commit -m "fix: tetap ke halaman OTP walau kirim OTP gagal"
```

---

### Task 2: Cegah Onboarding Tanpa WA — Check di Page Mount (S2a)

**Files:**
- Modify: `app/onboarding/page.tsx`

- [ ] **Step 1: Import `useEffect`**

```typescript
// Line 3 — tambah useEffect:
import { useState, useEffect } from "react";
```

- [ ] **Step 2: Tambah useEffect untuk cek phone_verified_at**

Sesudah `const [error, setError] = useState("");` (line 36), tambah:

```typescript
useEffect(() => {
  supabase.auth.getUser().then(async ({ data: { user } }) => {
    if (!user) return;
    const { data: profile } = await supabase
      .from("profiles")
      .select("phone_verified_at")
      .eq("id", user.id)
      .single();
    if (!profile?.phone_verified_at) {
      router.push("/auth/register?phone_unverified=true");
    }
  });
}, []);
```

- [ ] **Step 3: Commit**

```bash
git add app/onboarding/page.tsx
git commit -m "fix: redirect ke OTP kalau user belum verify WA"
```

---

### Task 3: Cegah Onboarding Tanpa WA — Check di Submit (S2b)

**Files:**
- Modify: `app/onboarding/page.tsx:56-66`

- [ ] **Step 1: Tambah pengecekan phone_verified_at sebelum insert barbershop**

Di `handleSubmit`, setelah `if (!user) { router.push("/auth/login"); return; }`:

```typescript
    const { data: profile } = await supabase
      .from("profiles")
      .select("phone_verified_at")
      .eq("id", user.id)
      .single();

    if (!profile?.phone_verified_at) {
      setError("Nomor WhatsApp belum diverifikasi. Silakan verifikasi dulu.");
      setLoading(false);
      return;
    }
```

- [ ] **Step 2: Commit**

```bash
git add app/onboarding/page.tsx
git commit -m "fix: safety net cek WA verify di submit onboarding"
```

---

### Task 4: Register Page Handle `phone_unverified` Query Param (S2c)

**Files:**
- Modify: `app/auth/register/page.tsx`

- [ ] **Step 1: Tambah useEffect untuk handle query param `phone_unverified`**

Sesudah `cooldownRef` declaration (line 23), tambah:

```typescript
  // Handle redirect dari onboarding — user sudah punya session, butuh verify WA
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("phone_unverified") === "true") {
      supabase.auth.getUser().then(async ({ data: { user } }) => {
        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("phone")
            .eq("id", user.id)
            .single();
          if (profile?.phone) {
            setForm(prev => ({ ...prev, phone: profile.phone }));
            setStep("otp");
          }
        }
      });
    }
  }, []);
```

- [ ] **Step 2: Commit**

```bash
git add app/auth/register/page.tsx
git commit -m "fix: handle redirect dari onboarding ke OTP verification"
```

---

### Task 5: Cek Existing Session di Register Page (S3)

**Files:**
- Modify: `app/auth/register/page.tsx`

**Catatan:** Sudah ada satu `useEffect` di component ini (line 25-41 untuk cooldown timer). Kita tambah satu `useEffect` lagi.

- [ ] **Step 1: Tambah useEffect untuk cek session (skip kalau `phone_unverified`)**

Sesudah task 4 `useEffect`, tambah:

```typescript
  // Redirect ke dashboard kalau sudah login (kecuali datang dari onboarding)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("phone_unverified") === "true") return;

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        router.push("/dashboard");
      }
    });
  }, []);
```

- [ ] **Step 2: Commit**

```bash
git add app/auth/register/page.tsx
git commit -m "fix: redirect ke dashboard kalau user sudah login"
```

---

### Task 6: Services Insert Error Handling (S4)

**Files:**
- Modify: `app/onboarding/page.tsx:91-93`

- [ ] **Step 1: Tambah error handling untuk services insert**

```typescript
// Sebelum (line 91-93):
    await supabase.from("services").insert(
      DEFAULT_SERVICES.map((s) => ({ ...s, barbershop_id: shop.id }))
    );

    router.push("/dashboard");

// Sesudah:
    const { error: servicesError } = await supabase.from("services").insert(
      DEFAULT_SERVICES.map((s) => ({ ...s, barbershop_id: shop.id }))
    );

    if (servicesError) {
      console.error("Gagal insert services:", servicesError);
      setError("Barbershop terbuat, tapi gagal menambahkan layanan default. Silakan cek di dashboard.");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
```

- [ ] **Step 2: Commit**

```bash
git add app/onboarding/page.tsx
git commit -m "fix: handle error saat insert services default"
```

---

### Task 7: Rebuild & Verifikasi proxy.ts (S5)

**Files:**
- No file changes — build command only

- [ ] **Step 1: Rebuild di server**

```bash
ssh root@109.111.53.58 -p 38954
cd /var/www/queuebarber
npm run build
```

- [ ] **Step 2: Verifikasi proxy terdaftar di manifest**

```bash
ls -la .next/server/*proxy* .next/server/*middleware*
cat .next/server/middleware-manifest.json 2>/dev/null | python3 -m json.tool | head -20
# Cari "proxy" atau nama fungsi proxy di output
```

Expected: fungsi `proxy` terdaftar dengan matcher yang sesuai.

- [ ] **Step 3: Restart PM2**

```bash
pm2 restart kapster
```

- [ ] **Step 4: Verifikasi proxy aktif di response**

```bash
curl -sI https://kapster.my.id/privacy-policy 2>&1 | grep -i content-security
```

Expected: CSP header terpasang (tanda proxy jalan).

- [ ] **Step 5: Test registrasi end-to-end**

```bash
# Buka browser, test:
# 1. Registrasi akun baru
# 2. Pastikan OTP step muncul
# 3. Verifikasi OTP
# 4. Onboarding
# 5. Dashboard
```

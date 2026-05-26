# Perbaikan Alur Autentikasi

## Masalah

### 1. OTP Gagal → User Stuck (atau "Nyolong" Onboarding)

**Alur masalah:**
1. User isi form registrasi → `signUp` sukses (auth.users terbuat)
2. `setupPhoneVerification` gagal kirim OTP via WhatsApp
3. User lihat error, tapi **tetap di step form** (`setStep("otp")` tidak pernah dipanggil)
4. User refresh → state hilang, form kosong
5. Submit ulang → `signUp` error "Email sudah terdaftar"
6. User lihat pesan: "Silakan login"
7. User buka `/dashboard` → karena masih punya session (dari signUp sebelumnya) → dashboard layout cek barbershop → tidak ada → **redirect ke `/onboarding`**
8. User isi onboarding → barbershop terbuat **tanpa verifikasi WhatsApp**

**Dampak:** Barbershop aktif dengan nomor WA tidak terverifikasi.

### 2. Register Page Tidak Cek Existing Session

**Alur masalah:**
- Kalau user sudah login (session aktif) dan buka `/auth/register`, form tetap muncul
- Submit form bisa bikin error aneh (user sudah punya session)
- Harusnya redirect ke dashboard/onboarding

### 3. Services Insert di Onboarding Tanpa Error Handling

**Alur masalah:**
- `app/onboarding/page.tsx:91` — `await supabase.from("services").insert(...)` tanpa try/catch
- Kalau insert gagal, user tetap redirect ke `/dashboard`
- Barbershop terbuat tanpa layanan default

### 4. proxy.ts Tidak Terdaftar di Build

**Alur masalah:**
- File `proxy.ts` (pengganti `middleware.ts` di Next.js 16) tidak muncul di `middleware-manifest.json`
- Semua logika security headers, redirect auth tidak jalan
- Perlu diverifikasi konvensi Next.js 16 untuk proxy

---

## Solusi

### S1: OTP Gagal → Tetap ke Halaman OTP

**File:** `app/auth/register/page.tsx:100-107`

**Perubahan:** Hapus `return` di blok error OTP, tetap lanjut ke `setStep("otp")`.

```typescript
// Sebelum:
const result = await setupPhoneVerification(form.phone);
if (result.error) {
  setError(result.error);
  setLoading(false);
  return;  // ← user stuck di form
}
setStep("otp");

// Sesudah:
const result = await setupPhoneVerification(form.phone);
if (result.error) {
  setError(result.error);  // tampilkan error
  // tetap lanjut ke OTP page
}
setStep("otp");
setLoading(false);
setResendCooldown(60);
```

**Alur setelah fix:**
1. `signUp` sukses
2. OTP gagal dikirim → user tetap ke halaman OTP + lihat pesan error
3. User klik "Kirim Ulang" (cooldown 60s) → `setupPhoneVerification` dipanggil lagi
4. OTP berhasil → user verifikasi → onboarding

**Catatan:** Fungsi `setupPhoneVerification` dipanggil oleh **handleSubmit** (line 100) dan **handleResendOtp** (line 136) — keduanya fungsi yang sama.

### S2: Cegah Onboarding Tanpa Verifikasi WA

**File:** `app/onboarding/page.tsx`

**Dua perubahan:**

**2a — Cek di page mount (redirect ke halaman OTP kalau belum verify)**

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
      // User punya session tapi belum verify WA → redirect ke OTP
      router.push("/auth/register?phone_unverified=true");
    }
  });
}, []);
```

**2b — Cek di submit (safety net)**

```typescript
if (!profile?.phone_verified_at) {
  setError("Nomor WhatsApp belum diverifikasi. Silakan verifikasi dulu.");
  setLoading(false);
  return;
}
```

**File:** `app/auth/register/page.tsx`

**Perubahan:** Handle query param `phone_unverified=true` — skip signUp, langsung ke step OTP.

```typescript
// Tambah di awal component, cek query param
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  if (params.get("phone_unverified") === "true") {
    // User sudah punya session, skip signUp, ambil phone dari profile
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
          setResendCooldown(0);  // biar user bisa langsung resend
        }
      }
    });
  }
}, []);
```

**Alur setelah fix:**
1. User buka `/onboarding` langsung
2. `useEffect` cek phone_verified_at → null → redirect ke `/auth/register?phone_unverified=true`
3. Register page detect query param → skip signUp → ambil phone dari profile → tampilkan OTP page
4. User verify OTP → redirect ke `/onboarding`
5. Onboarding page mount cek lagi → phone sudah verified → tampilkan form

### S3: Cek Existing Session di Register Page

**File:** `app/auth/register/page.tsx`

**Perubahan:** Tambah `useEffect` untuk cek session, tapi skip kalau ada query param `phone_unverified`.

```typescript
useEffect(() => {
  // Skip redirect kalau user datang dari onboarding (butuh verifikasi)
  const params = new URLSearchParams(window.location.search);
  if (params.get("phone_unverified") === "true") return;

  supabase.auth.getUser().then(({ data: { user } }) => {
    if (user) {
      router.push("/dashboard");
    }
  });
}, []);
```

### S4: Error Handling Services Insert

**File:** `app/onboarding/page.tsx:91-93`

```typescript
const { error: servicesError } = await supabase.from("services").insert(
  DEFAULT_SERVICES.map((s) => ({ ...s, barbershop_id: shop.id }))
);

if (servicesError) {
  // Hapus barbershop yang sudah terbuat? Atau log aja?
  console.error("Gagal insert services:", servicesError);
  setError("Barbershop terbuat, tapi gagal menambahkan layanan default.");
  setLoading(false);
  return;
}
```

### S5: proxy.ts Tidak Terdaftar

**Hasil investigasi:**
- Konvensi sudah sesuai: file `proxy.ts` di root, export `proxy` function, pakai matcher (dokumentasi Next.js 16.2.6)
- Build sebelumnya masih pake `middleware.ts` (old convention) — makanya ada `middleware-manifest.json`
- Setelah rename ke `proxy.ts`, build baru harusnya output `proxy-manifest.json` atau tetap `middleware-manifest.json`

**Action:** Rebuild ulang dan cek manifest:
```bash
ssh ke server
cd /var/www/queuebarber
npm run build
pm2 restart kapster
# Cek apakah proxy terdaftar
ls .next/server/*manifest* | grep proxy
```

---

## Prioritas

| Prioritas | Item | Dampak | Effort |
|-----------|------|--------|--------|
| P0 | S1: OTP gagal → halaman OTP | User stuck | 5 menit |
| P0 | S2: Cegah onboarding tanpa WA | Barbershop tanpa verified phone | 10 menit |
| P1 | S5: Cek proxy.ts | Seluruh proxy logic tidak jalan | 15 menit |
| P1 | S4: Services error handling | Barbershop tanpa layanan | 5 menit |
| P2 | S3: Session check register | UX minor | 5 menit |

# Forgot/Reset Password via WhatsApp — Design Spec

## Overview

Add forgot/reset password functionality to Kapster, using **WhatsApp-only** for the reset flow (no email-based reset). A phone number field is added to registration, verified via WhatsApp OTP, and subsequently used for password recovery.

## Database Changes

### New Table: `phone_otp_codes`

```sql
CREATE TABLE phone_otp_codes (
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

CREATE INDEX idx_phone_otp_codes_phone_purpose ON phone_otp_codes(phone, purpose);
CREATE INDEX idx_phone_otp_codes_expires ON phone_otp_codes(expires_at);
```

### Modified Table: `profiles`

Add column: `phone_verified_at TIMESTAMPTZ` (null = not verified)

## Flow: Registration

1. User fills form: `full_name`, `email`, `password`, `phone`
2. `supabase.auth.signUp()` — creates auth user with metadata
3. Server action creates `profiles` row with `phone`, `phone_verified_at = null`
4. Server action generates 6-digit OTP, stores hash in `phone_otp_codes`
5. OTP sent via WhatsApp using WuzAPI (new template `registration_otp`)
6. UI shows OTP input form inline after signup success
7. User enters OTP → server verifies → sets `phone_verified_at`
8. Redirect to `/onboarding`

## Flow: Forgot Password

1. User clicks "Lupa password?" on `/auth/login`
2. User enters `phone` on `/auth/forgot-password`
3. Server looks up `profiles.phone` — must exist and `phone_verified_at IS NOT NULL`
4. **If phone not found or not verified**: return generic "Jika nomor terdaftar dan sudah diverifikasi, kode OTP akan dikirim" (do NOT reveal whether phone exists)
5. Generates 6-digit OTP, stores hash in `phone_otp_codes`, sends via WhatsApp
6. Redirect to `/auth/forgot-password/verify` with phone in state
7. User enters OTP → server verifies → redirect to `/auth/forgot-password/reset`
8. User enters new password (min 8 chars, confirm)
9. Server checks that a verified OTP exists for this phone within last 5 min, then calls `supabase.auth.admin.updateUserById()` to set new password
10. Redirect to `/auth/login` with success message

## Server Actions

### `sendOTP(phone: string, purpose: 'registration_verification' | 'password_reset')`

- Normalize phone via `lib/phone.ts`
- Rate limit: check last OTP sent — must be >60s ago for same phone+purpose
- If purpose = `password_reset`: verify phone exists in `profiles` and is verified
- Generate 6-digit numeric code (crypto.randomInt)
- Hash code (SHA-256)
- Insert into `phone_otp_codes` with expiry 5 min
- Send via WhatsApp using appropriate template
- Return success (never reveal if phone exists)

### `verifyOTP(phone: string, code: string, purpose: string)`

- Normalize phone
- Find matching `phone_otp_codes` with same phone+purpose, not expired, not verified
- Compare code with hash
- If match: set `verified_at`, return success with `profile_id`
- If no match: increment `attempts`, if `attempts >= max_attempts` mark as failed
- Return generic error (don't reveal why)

### `resetPassword(phone: string, newPassword: string)`

- Normalize phone
- Check for an OTP with same phone, `purpose = 'password_reset'`, `verified_at IS NOT NULL` and within last 5 minutes
- If found: delete the OTP record (prevent reuse), look up `profile_id`, call `supabase.auth.admin.updateUserById(profile_id, { password: newPassword })`
- If not found: return error (OTP not yet verified or expired)
- Return success

## New WhatsApp Templates

In `lib/wa-templates.ts`, add event types:
- `registration_otp`: "Kode verifikasi akun Kapster kamu: {code}. Kode berlaku 5 menit. Jangan bagikan kode ini ke siapa pun."
- `password_reset_otp`: "Kode reset password Kapster kamu: {code}. Kode berlaku 5 menit. Jangan bagikan kode ini ke siapa pun."

## New Pages

| Route | Description |
|---|---|
| `/auth/forgot-password` | Form: input nomor HP → submit → kirim OTP |
| `/auth/forgot-password/verify` | Form: input OTP 6 digit → submit → verify |
| `/auth/forgot-password/reset` | Form: password baru + konfirmasi → submit → reset |

## Modified Pages

| Page | Change |
|---|---|
| `/auth/login` | Add "Lupa password?" link below password field |
| `/auth/register` | Add `phone` input field + inline OTP verification step after signup |

## Security Rules

- OTP: 6-digit numeric, 5 min expiry, 3 max attempts, SHA-256 hashed
- Rate limit: 1 OTP send per 60s per phone+purpose
- Never reveal whether a phone number exists in the system (always return generic success message on sendOTP)
- Reset password only allowed if `phone_verified_at` is not null
- Supabase Admin API key (service_role) used only for `updateUserById`

## Rate Limiting

- `sendOTP`: check `created_at` of last OTP for same phone+purpose, must be ≥60s ago
- `verifyOTP`: max 3 attempts per OTP record
- Cleanup: periodic deletion of expired OTP records (optional, could be a cron job)

## Testing Plan

- Unit test OTP generation and hashing
- Unit test phone normalization
- Integration test registration with phone verification
- Integration test forgot password flow
- Test rate limiting behavior
- Test OTP expiry edge cases
- Test error cases: invalid phone, wrong OTP, expired OTP, too many attempts

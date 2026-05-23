"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizePhone, validatePhone } from "@/lib/phone";
import { generateOTP, hashOTP } from "@/lib/otp";
import { sendTextMessage, SYSTEM_WUZAPI_TOKEN } from "@/lib/wuzapi";
import { renderWATemplate } from "@/lib/wa-templates";

export async function setupPhoneVerification(phone: string) {
  // Log inisiasi awal diletakkan di luar try untuk memastikan fungsi terpanggil
  console.log(`[PhoneVerification] Started for input: ${phone}`);

  try {
    const supabase = await createClient();
    const admin = createAdminClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.warn(`[PhoneVerification][Auth] Failed: Session not found`);
      return { error: "Sesi tidak ditemukan. Silakan login ulang." };
    }
    
    console.log(`[PhoneVerification] User authenticated: ${user.id}`);

    const normalized = normalizePhone(phone);
    const validation = validatePhone(phone);
    if (!validation.valid) {
      console.warn(`[PhoneVerification][Validation] Invalid phone: ${phone} -> ${validation.error}`);
      return { error: validation.error };
    }

    // Upsert profile with phone
    const { error: upsertError } = await admin
      .from("profiles")
      .upsert({
        id: user.id,
        phone: normalized,
        full_name: user.user_metadata?.full_name,
        updated_at: new Date().toISOString(),
      }, { onConflict: "id" });

    if (upsertError) {
      console.error(`[PhoneVerification][DB] Upsert profile failed:`, upsertError.message);
      return { error: "Gagal menyimpan nomor HP." };
    }
    console.log(`[PhoneVerification][DB] Profile upserted successfully`);

    // Rate limit check
    const { data: lastOtp } = await admin
      .from("phone_otp_codes")
      .select("created_at")
      .eq("phone", normalized)
      .eq("purpose", "registration_verification")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (lastOtp) {
      const elapsed = (Date.now() - new Date(lastOtp.created_at).getTime()) / 1000;
      if (elapsed < 60) {
        console.warn(`[PhoneVerification][RateLimit] Throttled. Elapsed: ${Math.round(elapsed)}s`);
        return { error: "Tunggu 60 detik sebelum mengirim ulang." };
      }
    }

    const code = generateOTP();
    const codeHash = hashOTP(code);

    const { error: insertError } = await admin
      .from("phone_otp_codes")
      .insert({
        phone: normalized,
        code_hash: codeHash,
        purpose: "registration_verification",
        profile_id: user.id,
        expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      });

    if (insertError) {
      console.error(`[PhoneVerification][DB] Insert OTP failed:`, insertError.message);
      return { error: "Gagal menyimpan kode OTP." };
    }
    console.log(`[PhoneVerification][DB] OTP code generated and saved`);

    const message = renderWATemplate("registration_otp", {
      name: "", barbershop: "", code,
    });

    if (!SYSTEM_WUZAPI_TOKEN) {
      console.error(`[PhoneVerification][WA] Config error: SYSTEM_WUZAPI_TOKEN is missing`);
      return { error: "WhatsApp sistem belum dikonfigurasi. Hubungi admin." };
    }

    console.log(`[PhoneVerification][WA] Sending OTP to ${normalized}...`);
    const sendResult = await sendTextMessage(SYSTEM_WUZAPI_TOKEN, normalized, message);
    
    if (!sendResult.success) {
      console.error(`[PhoneVerification][WA] Send failed:`, sendResult.error);
      return { error: sendResult.error || "Gagal mengirim kode OTP via WhatsApp." };
    }

    console.log(`[PhoneVerification][Success] OTP sent to ${normalized}`);
    return { success: true };

  } catch (fatalError) {
    // Menangkap segala jenis error fatal/unhandled rejection di dalam fungsi ini
    console.error(`[PhoneVerification][FATAL_CRASH] An unexpected error occurred:`, fatalError);
    
    return { 
      error: "Terjadi kesalahan internal pada server. Silakan coba beberapa saat lagi."  + fatalError
    };
  }
}

export async function sendOTP(phone: string, purpose: "registration_verification" | "password_reset") {
  const admin = createAdminClient();

  const normalized = normalizePhone(phone);
  const validation = validatePhone(phone);
  if (!validation.valid) return { error: validation.error };

  // For password_reset, only send OTP if phone exists in profiles
  if (purpose === "password_reset") {
    const { count } = await admin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("phone", normalized);

    if (count === 0) {
      return { success: true, message: "Jika nomor terdaftar, kode OTP akan dikirim." };
    }
  }

  // Rate limit
  const { data: lastOtp } = await admin
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

  // Look up profile_id for password_reset
  let profileId: string | undefined;
  if (purpose === "password_reset") {
    const { data: profile } = await admin
      .from("profiles")
      .select("id")
      .eq("phone", normalized)
      .maybeSingle();
    if (profile) profileId = profile.id;
  }

  const code = generateOTP();
  const codeHash = hashOTP(code);

  const { error: insertError } = await admin
    .from("phone_otp_codes")
    .insert({
      phone: normalized,
      code_hash: codeHash,
      purpose,
      profile_id: profileId,
      expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    });

  if (insertError) return { error: "Gagal menyimpan kode OTP." };

  const template = purpose === "registration_verification" ? "registration_otp" : "password_reset_otp";
  const message = renderWATemplate(template, { name: "", barbershop: "", code });

  if (!SYSTEM_WUZAPI_TOKEN) {
    return { error: "WhatsApp sistem belum dikonfigurasi. Hubungi admin." };
  }

  const sendResult = await sendTextMessage(SYSTEM_WUZAPI_TOKEN, normalized, message);
  if (!sendResult.success) {
    return { error: sendResult.error || "Gagal mengirim kode OTP via WhatsApp." };
  }

  return { success: true };
}

export async function verifyOTP(phone: string, code: string, purpose: "registration_verification" | "password_reset") {
  const admin = createAdminClient();
  const normalized = normalizePhone(phone);

  const { data: otpRecords, error: fetchError } = await admin
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
      await admin
        .from("phone_otp_codes")
        .update({ attempts: newAttempts, expires_at: new Date(0).toISOString() })
        .eq("id", otpRecord.id);
      return { error: "Kode OTP salah 3 kali. Silakan minta kode baru." };
    }
    await admin
      .from("phone_otp_codes")
      .update({ attempts: newAttempts })
      .eq("id", otpRecord.id);
    return { error: "Kode OTP salah." };
  }

  // Mark OTP as verified
  const now = new Date().toISOString();
  await admin
    .from("phone_otp_codes")
    .update({ verified_at: now })
    .eq("id", otpRecord.id);

  // Mark profile phone as verified
  if (otpRecord.profile_id) {
    await admin
      .from("profiles")
      .update({ phone_verified_at: now })
      .eq("id", otpRecord.profile_id);
  }

  return { success: true };
}

export async function resetPassword(phone: string, newPassword: string) {
  const admin = createAdminClient();
  const normalized = normalizePhone(phone);

  if (!newPassword || newPassword.length < 8) {
    return { error: "Password minimal 8 karakter." };
  }

  // Find a verified OTP within the expiry window
  const { data: otpRecords } = await admin
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

  // Look up profile by OTP record profile_id or phone
  let profileId = otpRecord.profile_id;
  if (!profileId) {
    const { data: profile } = await admin
      .from("profiles")
      .select("id")
      .eq("phone", normalized)
      .maybeSingle();
    if (profile) profileId = profile.id;
  }

  if (!profileId) {
    return { error: "Akun dengan nomor ini tidak ditemukan. Pastikan nomor WhatsApp sudah terdaftar di akun kamu." };
  }

  // Update password via Supabase Admin API
  const { error: updateError } = await admin.auth.admin.updateUserById(
    profileId,
    { password: newPassword }
  );

  if (updateError) {
    return { error: "Gagal mengupdate password. Silakan coba lagi." };
  }

  // Clean up OTP record
  await admin
    .from("phone_otp_codes")
    .delete()
    .eq("id", otpRecord.id);

  return { success: true };
}

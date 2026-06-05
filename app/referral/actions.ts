"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { sendTextMessage, SYSTEM_WUZAPI_TOKEN } from "@/lib/wuzapi";
import { logError } from "@/lib/error-logger";
import { randomUUID } from "crypto";
import type { ReferralCodeRow } from "@/lib/referral-types";

function generateCode(): string {
  return Math.random().toString(36).slice(2, 10);
}

function normalizeWaNumber(wa: string): string {
  const cleaned = wa.replace(/\D/g, "");
  if (cleaned.startsWith("62")) return cleaned;
  if (cleaned.startsWith("0")) return "62" + cleaned.slice(1);
  return "62" + cleaned;
}

async function sendWaNotification(
  phone: string,
  name: string,
  code: string,
  token: string
) {
  if (!SYSTEM_WUZAPI_TOKEN) return;

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://kapster.my.id";
  const referralLink = `${baseUrl}?ref=${code}`;
  const performanceLink = `${baseUrl}/referral/${code}?t=${token}`;

  const message = [
    `Halo ${name}!`,
    "",
    "Terima kasih sudah mendaftar sebagai referrer Kapster.",
    "",
    "Berikut link referral kamu:",
    referralLink,
    "",
    "Pantau performa referral kamu di sini:",
    performanceLink,
    "",
    "Setiap barbershop yang daftar via link kamu, kamu dapat Rp3.500!",
  ].join("\n");

  try {
    await sendTextMessage(SYSTEM_WUZAPI_TOKEN, phone, message);
  } catch (err) {
    logError("referral/sendWaNotification", err, { phone, code });
  }
}

export async function daftarReferrer(formData: FormData) {
  const name = formData.get("name") as string;
  const wa_number = formData.get("wa_number") as string;

  if (!name || name.trim().length < 2) {
    return { error: "Nama harus minimal 2 karakter." };
  }
  if (!wa_number || wa_number.replace(/\D/g, "").length < 8) {
    return { error: "Nomor WhatsApp tidak valid." };
  }

  const normalizedWa = normalizeWaNumber(wa_number);
  const access_token = randomUUID();
  const supabase = createAdminClient() as any;

  for (let attempt = 0; attempt < 3; attempt++) {
    const code = generateCode();

    const { data, error } = (await supabase
      .from("referral_codes")
      .insert({
        name: name.trim(),
        wa_number: normalizedWa,
        code,
        access_token,
        balance: 0,
        total_earned: 0,
        total_withdrawn: 0,
      })
      .select()
      .single()) as unknown as { data: ReferralCodeRow | null; error: any };

    if (!error) {
      sendWaNotification(normalizedWa, name.trim(), data!.code, data!.access_token);
      return { success: true, code: data!.code, token: data!.access_token };
    }

    if (error.code !== "23505") {
      logError("referral/daftarReferrer", error, { name, wa_number });
      return { error: "Gagal mendaftar. Silakan coba lagi." };
    }
  }

  return { error: "Gagal membuat kode unik. Silakan coba lagi." };
}

export async function requestPayout(formData: FormData) {
  const referral_code_id = formData.get("referral_code_id") as string;
  const amount = parseInt(formData.get("amount") as string, 10);
  const method = formData.get("method") as string;
  const bank_info = formData.get("bank_info") as string;

  if (!referral_code_id) {
    return { error: "ID referral code tidak valid." };
  }

  if (isNaN(amount) || amount < 25000) {
    return { error: "Minimum penarikan adalah Rp25.000." };
  }

  const supabase = createAdminClient() as any;

  const { data: codeRow } = (await supabase
    .from("referral_codes")
    .select("balance")
    .eq("id", referral_code_id)
    .single()) as unknown as { data: { balance: number } | null; error: any };

  if (!codeRow) {
    return { error: "Referral code tidak ditemukan." };
  }

  if (codeRow.balance < amount) {
    return { error: "Saldo tidak mencukupi." };
  }

  let bankInfoJson: Record<string, unknown> | null = null;
  try {
    if (bank_info) bankInfoJson = JSON.parse(bank_info);
  } catch {
    bankInfoJson = { info: bank_info };
  }

  const { error } = (await supabase
    .from("payout_requests")
    .insert({
      referral_code_id,
      amount,
      method: method || null,
      bank_info: bankInfoJson,
      status: "pending",
    })) as unknown as { error: any };

  if (error) {
    logError("referral/requestPayout", error, { referral_code_id, amount });
    return { error: "Gagal mengajukan penarikan. Silakan coba lagi." };
  }

  return { success: true };
}

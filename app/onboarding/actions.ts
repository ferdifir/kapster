"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { lookupReferralCode, createReferralRecord } from "@/lib/referral";

export async function applyReferral(barbershopId: string, referralCode: string) {
  const referrer = await lookupReferralCode(referralCode);
  if (!referrer) return { error: "Kode referral tidak valid" };

  const supabase = createAdminClient();
  const { data: shop } = await supabase
    .from("barbershops")
    .select("owner_id")
    .eq("id", barbershopId)
    .single();

  if (shop && referrer.profile_id && referrer.profile_id === shop.owner_id) {
    return { error: "Tidak bisa self-referral" };
  }

  try {
    const record = await createReferralRecord(referrer.id, barbershopId);
    if (record) {
      return { success: true };
    }
    return { error: "Barbershop sudah terdaftar referral" };
  } catch (err) {
    return { error: "Gagal menyimpan referral" };
  }
}

"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function markPayoutPaid(
  payoutId: string,
  referralCodeId: string,
  amount: number
) {
  const supabase = createAdminClient();

  const { error: payoutError } = await (supabase as any)
    .from("payout_requests")
    .update({ status: "paid", paid_at: new Date().toISOString() })
    .eq("id", payoutId);

  if (payoutError) throw new Error("Failed to update payout");

  const { data: rc } = await (supabase as any)
    .from("referral_codes")
    .select("balance, total_withdrawn")
    .eq("id", referralCodeId)
    .single();

  if (rc) {
    await (supabase as any)
      .from("referral_codes")
      .update({
        balance: rc.balance - amount,
        total_withdrawn: rc.total_withdrawn + amount,
      })
      .eq("id", referralCodeId);
  }

  revalidatePath("/admin/referrals");
}

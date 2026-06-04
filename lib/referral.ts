import { createAdminClient } from "@/lib/supabase/admin";
import { logError } from "@/lib/error-logger";
import type { ReferralCodeRow, ReferralRow } from "@/lib/referral-types";

export async function lookupReferralCode(code: string) {
  const supabase = createAdminClient();

  const { data, error } = await supabase.rpc("lookup_referral_code", {
    p_code: code,
  });

  if (error) {
    logError("referral/lookupReferralCode", error, { code });
    return null;
  }

  if (!data || !Array.isArray(data) || data.length === 0) return null;
  return data[0] as { id: string; code: string; profile_id: string | null; name: string | null };
}

export async function createReferralCode(input: {
  code: string;
  profileId?: string;
  name?: string;
  waNumber?: string;
}) {
  const supabase = createAdminClient();

  const { data, error } = (await supabase
    .from("referral_codes")
    .insert({
      code: input.code,
      profile_id: input.profileId ?? null,
      name: input.name ?? null,
      wa_number: input.waNumber ?? null,
    })
    .select()
    .single()) as unknown as { data: ReferralCodeRow | null; error: any };

  if (error) throw error;
  return data;
}

export async function createReferralRecord(
  referralCodeId: string,
  barbershopId: string
) {
  const supabase = createAdminClient();

  const { data, error } = (await supabase
    .from("referrals")
    .insert({
      referral_code_id: referralCodeId,
      barbershop_id: barbershopId,
      status: "pending",
    })
    .select()
    .single()) as unknown as { data: ReferralRow | null; error: any };

  if (error) {
    if (error.code === "23505") return null;
    throw error;
  }
  return data;
}

export async function creditReferralCommission(barbershopId: string) {
  const supabase = createAdminClient();

  const { data: referral } = (await supabase
    .from("referrals")
    .select("*")
    .eq("barbershop_id", barbershopId)
    .eq("status", "pending")
    .single()) as unknown as { data: ReferralRow | null; error: any };

  if (!referral) return null;

  const commission = referral.commission;

  const { error: updateError } = await supabase
    .from("referrals")
    .update({ status: "earned", earned_at: new Date().toISOString() })
    .eq("id", referral.id);

  if (updateError) throw updateError;

  const { error: rpcError } = await supabase.rpc("increment_referral_balance", {
    p_referral_code_id: referral.referral_code_id,
    p_amount: commission,
  });

  if (rpcError) {
    const { data: codeRow } = (await supabase
      .from("referral_codes")
      .select("balance, total_earned")
      .eq("id", referral.referral_code_id)
      .single()) as unknown as { data: { balance: number; total_earned: number } | null };

    if (!codeRow) throw rpcError;

    const { error: fallbackError } = await supabase
      .from("referral_codes")
      .update({
        balance: codeRow.balance + commission,
        total_earned: codeRow.total_earned + commission,
      } as any)
      .eq("id", referral.referral_code_id);

    if (fallbackError) throw fallbackError;
  }

  return { commission };
}

export async function createReferralCodeForProfile(profileId: string) {
  const supabase = createAdminClient();

  const { data: existing } = (await supabase
    .from("referral_codes")
    .select("*")
    .eq("profile_id", profileId)
    .maybeSingle()) as unknown as { data: ReferralCodeRow | null };

  if (existing) return existing;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", profileId)
    .single();

  const { data: shop } = await supabase
    .from("barbershops")
    .select("slug")
    .eq("owner_id", profileId)
    .maybeSingle();

  const namePart = profile?.full_name
    ? profile.full_name.toLowerCase().replace(/\s+/g, "").replace(/[^a-z0-9]/g, "")
    : "user";
  const slugPart = shop?.slug ?? namePart;
  const code = `${slugPart}-${Math.random().toString(36).slice(2, 6)}`;

  const { data: created, error } = (await supabase
    .from("referral_codes")
    .insert({
      profile_id: profileId,
      name: profile?.full_name ?? null,
      code,
    })
    .select()
    .single()) as unknown as { data: ReferralCodeRow | null; error: any };

  if (error) throw error;
  return created;
}

export async function getReferralStats(referralCodeId: string) {
  const supabase = createAdminClient();

  const { data: referrer } = (await supabase
    .from("referral_codes")
    .select("*")
    .eq("id", referralCodeId)
    .single()) as unknown as { data: ReferralCodeRow | null; error: any };

  if (!referrer) return null;

  const { data: referrals } = (await supabase
    .from("referrals")
    .select("*, barbershops!inner(name)")
    .eq("referral_code_id", referralCodeId)
    .order("created_at", { ascending: false })) as unknown as {
    data: (ReferralRow & { barbershops: { name: string } })[] | null;
  };

  return {
    referrer,
    referrals: (referrals ?? []).map((r) => ({
      id: r.id,
      referral_code_id: r.referral_code_id,
      barbershop_id: r.barbershop_id,
      shop_name: r.barbershops.name,
      status: r.status,
      commission: r.commission,
      earned_at: r.earned_at,
      paid_at: r.paid_at,
      created_at: r.created_at,
    })),
  };
}

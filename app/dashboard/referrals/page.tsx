import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { createReferralCodeForProfile } from "@/lib/referral";
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
  if (!rc) redirect("/onboarding");

  const { data: referralRows } = await (supabase as any)
    .from("referrals")
    .select("*, barbershops!inner(name)")
    .eq("referral_code_id", rc.id)
    .order("created_at", { ascending: false });

  const referrals = (referralRows || []).map((r: any) => ({
    id: r.id,
    shop_name: r.barbershops?.name || "Unknown",
    status: r.status,
    commission: r.commission,
    earned_at: r.earned_at,
    created_at: r.created_at,
  }));

  const pendingCount = referrals.filter((r: any) => r.status === "pending").length;
  const earnedCount = referrals.filter((r: any) => r.status === "earned").length;

  return (
    <OwnerReferralClient
      rc={rc}
      referrals={referrals}
      pendingCount={pendingCount}
      earnedCount={earnedCount}
    />
  );
}

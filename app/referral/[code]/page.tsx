/* eslint-disable @typescript-eslint/no-explicit-any */

import { createAdminClient } from "@/lib/supabase/admin";
import ReferrerDashboard from "./ReferrerDashboard";
import type { ReferralCodeRow } from "@/lib/referral-types";

interface PageProps {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ t?: string }>;
}

export default async function ReferralCodePage({ params, searchParams }: PageProps) {
  const { code: codeParam } = await params;
  const { t } = await searchParams;

  if (!t) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="font-display text-2xl font-bold text-white mb-2">Link Tidak Valid</h1>
          <p className="text-dark-400 text-sm">Kamu perlu token akses. Cek link yang dikirim via WhatsApp.</p>
        </div>
      </div>
    );
  }

  const supabase = createAdminClient() as any;

  const { data: rc } = await (supabase
    .from("referral_codes")
    .select("*")
    .eq("code", codeParam)
    .eq("access_token", t)
    .single() as unknown as Promise<{ data: ReferralCodeRow | null; error: any }>);

  if (!rc) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="font-display text-2xl font-bold text-white mb-2">Akses Ditolak</h1>
          <p className="text-dark-400 text-sm">Token akses tidak cocok.</p>
        </div>
      </div>
    );
  }

  const { data: referralRows } = await (supabase
    .from("referrals")
    .select("*, barbershops!inner(name)")
    .eq("referral_code_id", rc.id)
    .order("created_at", { ascending: false }) as unknown as Promise<{ data: any[] | null; error: any }>);

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
    <ReferrerDashboard
      rc={rc}
      referrals={referrals}
      pendingCount={pendingCount}
      earnedCount={earnedCount}
    />
  );
}

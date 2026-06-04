import { createAdminClient } from "@/lib/supabase/admin";
import { markPayoutPaid } from "./actions";

function StatCard({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div className={`p-6 rounded-2xl border ${accent ? "bg-barber-400/10 border-barber-400/30" : "bg-dark-800/50 border-dark-700/30"}`}>
      <p className="text-dark-400 text-sm mb-1">{label}</p>
      <p className={`font-display text-3xl font-bold ${accent ? "text-barber-400" : "text-white"}`}>{value}</p>
    </div>
  );
}

export default async function AdminReferralsPage() {
  const supabase = createAdminClient();

  const [
    { data: referralCodes },
    { data: referrals },
    { data: payoutRequests },
    { data: profiles },
  ] = await Promise.all([
    (supabase as any).from("referral_codes").select("*").order("created_at", { ascending: false }),
    (supabase as any).from("referrals").select("*").order("created_at", { ascending: false }),
    (supabase as any).from("payout_requests").select("*").order("requested_at", { ascending: false }),
    supabase.from("profiles").select("id, full_name"),
  ]);

  const profileMap = new Map((profiles ?? []).map((p: { id: string; full_name: string | null }) => [p.id, p.full_name]));

  const totalReferrers = referralCodes?.length ?? 0;
  const totalReferrals = referrals?.length ?? 0;
  const totalWithdrawn = (referralCodes ?? []).reduce((sum: number, rc: { total_withdrawn: number }) => sum + (rc.total_withdrawn ?? 0), 0);
  const pendingPayouts = (payoutRequests ?? []).filter((pr: { status: string }) => pr.status === "pending").length;

  const referralCounts = new Map<string, number>();
  for (const r of referrals ?? []) {
    referralCounts.set(r.referral_code_id, (referralCounts.get(r.referral_code_id) ?? 0) + 1);
  }

  function getReferrerName(rc: { profile_id: string | null; name: string | null }) {
    if (rc.profile_id && profileMap.has(rc.profile_id)) return profileMap.get(rc.profile_id) ?? rc.name ?? "-";
    return rc.name ?? "-";
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-white mb-1">Referral Management</h1>
        <p className="text-dark-400 text-sm">Kelola program referral, payout, dan referrer</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <StatCard label="Total Referrer" value={totalReferrers} />
        <StatCard label="Total Referral" value={totalReferrals} />
        <StatCard label="Komisi Dibayar" value={`Rp ${totalWithdrawn.toLocaleString("id-ID")}`} />
        <StatCard label="Pending Payout" value={pendingPayouts} accent />
      </div>

      <div className="bg-dark-800/50 border border-dark-700/30 rounded-2xl p-6">
        <h2 className="font-semibold text-white mb-4">Permintaan Payout</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-dark-700/30 text-left text-dark-400 text-sm">
                <th className="p-4 font-medium whitespace-nowrap">Referrer</th>
                <th className="p-4 font-medium whitespace-nowrap">Jumlah</th>
                <th className="p-4 font-medium whitespace-nowrap hidden sm:table-cell">Metode</th>
                <th className="p-4 font-medium whitespace-nowrap hidden md:table-cell">Tanggal</th>
                <th className="p-4 font-medium whitespace-nowrap">Status</th>
                <th className="p-4 font-medium whitespace-nowrap">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {(payoutRequests ?? []).length === 0 && (
                <tr><td colSpan={6} className="p-8 text-center text-dark-500">Belum ada permintaan payout</td></tr>
              )}
              {(payoutRequests ?? []).map((pr: any) => {
                const rc = (referralCodes ?? []).find((r: any) => r.id === pr.referral_code_id);
                return (
                  <tr key={pr.id} className="border-b border-dark-700/20 hover:bg-dark-700/20 transition-colors">
                    <td className="p-4 text-white font-medium whitespace-nowrap">{rc ? getReferrerName(rc) : "-"}</td>
                    <td className="p-4 text-dark-200 whitespace-nowrap">Rp {pr.amount.toLocaleString("id-ID")}</td>
                    <td className="p-4 text-dark-300 whitespace-nowrap hidden sm:table-cell">{pr.method ?? "-"}</td>
                    <td className="p-4 text-dark-400 text-sm whitespace-nowrap hidden md:table-cell">{new Date(pr.requested_at).toLocaleDateString("id-ID")}</td>
                    <td className="p-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                        pr.status === "pending" ? "bg-yellow-500/10 text-yellow-400" :
                        pr.status === "paid" ? "bg-green-500/10 text-green-400" :
                        "bg-red-500/10 text-red-400"
                      }`}>{pr.status}</span>
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      {pr.status === "pending" && (
                        <form action={markPayoutPaid.bind(null, pr.id, pr.referral_code_id, pr.amount)}>
                          <button type="submit" className="px-3 py-1.5 rounded-xl bg-barber-400/10 text-barber-400 border border-barber-400/20 text-xs font-medium hover:bg-barber-400/20 transition-all">
                            Tandai Dibayar
                          </button>
                        </form>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-dark-800/50 border border-dark-700/30 rounded-2xl p-6">
        <h2 className="font-semibold text-white mb-4">Semua Referrer</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[650px]">
            <thead>
              <tr className="border-b border-dark-700/30 text-left text-dark-400 text-sm">
                <th className="p-4 font-medium whitespace-nowrap">Nama</th>
                <th className="p-4 font-medium whitespace-nowrap">Kode</th>
                <th className="p-4 font-medium whitespace-nowrap hidden sm:table-cell">WA</th>
                <th className="p-4 font-medium whitespace-nowrap">Saldo</th>
                <th className="p-4 font-medium whitespace-nowrap hidden md:table-cell">Total Cair</th>
                <th className="p-4 font-medium whitespace-nowrap">Jumlah Referral</th>
              </tr>
            </thead>
            <tbody>
              {(referralCodes ?? []).length === 0 && (
                <tr><td colSpan={6} className="p-8 text-center text-dark-500">Belum ada referrer</td></tr>
              )}
              {(referralCodes ?? []).map((rc: any) => (
                <tr key={rc.id} className="border-b border-dark-700/20 hover:bg-dark-700/20 transition-colors">
                  <td className="p-4 text-white font-medium whitespace-nowrap">{getReferrerName(rc)}</td>
                  <td className="p-4 text-dark-200 font-mono text-sm whitespace-nowrap">{rc.code}</td>
                  <td className="p-4 text-dark-300 whitespace-nowrap hidden sm:table-cell">{rc.wa_number ?? "-"}</td>
                  <td className="p-4 text-dark-200 whitespace-nowrap">Rp {rc.balance.toLocaleString("id-ID")}</td>
                  <td className="p-4 text-dark-300 whitespace-nowrap hidden md:table-cell">Rp {rc.total_withdrawn.toLocaleString("id-ID")}</td>
                  <td className="p-4 whitespace-nowrap">
                    <span className="px-2 py-1 rounded-lg bg-dark-700/50 text-dark-200 text-xs font-medium">{referralCounts.get(rc.id) ?? 0}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

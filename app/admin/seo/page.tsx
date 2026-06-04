import { createAdminClient } from "@/lib/supabase/admin";
import { triggerSeoAudit } from "./actions";

export default async function AdminSeoPage() {
  const supabase = createAdminClient();

  const { data: metrics } = await supabase
    .from("content_metrics")
    .select("*")
    .order("metric_date", { ascending: false })
    .limit(20);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-white">SEO Audit</h1>
        <form action={triggerSeoAudit}>
          <button type="submit" className="px-4 py-2 rounded-xl bg-barber-400/10 text-barber-400 border border-barber-400/20 text-sm hover:bg-barber-400/20 transition-all">🔄 Trigger Audit</button>
        </form>
      </div>

      <div className="bg-dark-800/50 border border-dark-700/30 rounded-2xl p-6">
        <p className="text-dark-400 text-sm mb-2">Audit berjalan di background via cron. Trigger manual akan menjalankan script seo-audit.ts.</p>
        <p className="text-dark-500 text-xs">Cek hasil audit di tab cron atau log server.</p>
      </div>

      <div className="bg-dark-800/50 border border-dark-700/30 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[400px]">
            <thead>
              <tr className="border-b border-dark-700/30 text-left text-dark-400 text-sm">
                <th className="p-4 font-medium whitespace-nowrap">Metric</th>
                <th className="p-4 font-medium whitespace-nowrap">Value</th>
                <th className="p-4 font-medium whitespace-nowrap hidden sm:table-cell">Tanggal</th>
              </tr>
            </thead>
            <tbody>
              {metrics?.map((m) => (
                <tr key={m.id} className="border-b border-dark-700/20 hover:bg-dark-700/20 transition-colors">
                  <td className="p-4 text-white whitespace-nowrap">{m.metric_name}</td>
                  <td className="p-4 text-dark-200 whitespace-nowrap">{m.metric_value}</td>
                  <td className="p-4 text-dark-400 text-sm whitespace-nowrap hidden sm:table-cell">{new Date(m.metric_date).toLocaleDateString("id-ID")}</td>
                </tr>
              ))}
              {(!metrics || metrics.length === 0) && (
                <tr><td colSpan={3} className="p-8 text-center text-dark-500">Belum ada data audit</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

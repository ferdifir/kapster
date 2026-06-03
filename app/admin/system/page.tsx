export const dynamic = "force-dynamic";

import { createAdminClient } from "@/lib/supabase/admin";

async function getMetrics() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/admin/api/system/metrics`, { cache: "no-store" });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export default async function AdminSystemPage() {
  const supabase = createAdminClient();
  const metrics = await getMetrics();

  const { count: waPending } = await supabase
    .from("wa_notifications")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending");

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-white">System Health</h1>
        <span className="text-dark-500 text-xs">{metrics?.timestamp ? new Date(metrics.timestamp).toLocaleString("id-ID") : ""}</span>
      </div>

      {metrics ? (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-dark-800/50 border border-dark-700/30">
              <p className="text-dark-400 text-xs mb-1">CPU</p>
              <p className="text-white font-display text-xl font-bold">{metrics.server.cpu}%</p>
            </div>
            <div className="p-4 rounded-2xl bg-dark-800/50 border border-dark-700/30">
              <p className="text-dark-400 text-xs mb-1">Memory</p>
              <p className="text-white font-mono text-sm">{metrics.server.memory}</p>
            </div>
            <div className="p-4 rounded-2xl bg-dark-800/50 border border-dark-700/30">
              <p className="text-dark-400 text-xs mb-1">Disk</p>
              <p className="text-white font-mono text-sm">{metrics.server.disk}</p>
            </div>
            <div className="p-4 rounded-2xl bg-dark-800/50 border border-dark-700/30">
              <p className="text-dark-400 text-xs mb-1">Uptime</p>
              <p className="text-white text-sm">{metrics.server.uptime}</p>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-dark-800/50 border border-dark-700/30 rounded-2xl p-6">
              <h2 className="font-semibold text-white mb-4">Database</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-dark-400">Koneksi Aktif</span>
                  <span className="text-white">{metrics.database.connections}</span>
                </div>
              </div>
            </div>

            <div className="bg-dark-800/50 border border-dark-700/30 rounded-2xl p-6">
              <h2 className="font-semibold text-white mb-4">WhatsApp Gateway</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-dark-400">Notifikasi Pending</span>
                  <span className={waPending && waPending > 10 ? "text-yellow-400" : "text-white"}>{waPending ?? 0}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-dark-800/50 border border-dark-700/30 rounded-2xl p-6">
            <h2 className="font-semibold text-white mb-4">Cron Jobs</h2>
            <div className="space-y-3">
              {[
                { label: "Blog Generator", log: metrics.cron.blog },
                { label: "SEO Audit", log: metrics.cron.seo },
              ].map((job) => (
                <div key={job.label} className="p-3 rounded-xl bg-dark-700/30">
                  <p className="text-white text-sm font-medium mb-1">{job.label}</p>
                  <p className="text-dark-500 text-xs font-mono truncate">{job.log || "Belum ada log"}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="bg-dark-800/50 border border-dark-700/30 rounded-2xl p-8 text-center text-dark-500">
          Tidak bisa mengambil metrics server (pastikan endpoint internal tersedia)
        </div>
      )}
    </div>
  );
}

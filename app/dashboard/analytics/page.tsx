import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

function fmt(n: number) {
  return n.toLocaleString("id-ID");
}

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="bg-dark-800/50 border border-dark-700/30 rounded-2xl p-5">
      <p className="text-dark-400 text-sm mb-1">{label}</p>
      <p className="font-display text-3xl font-bold text-white">{value}</p>
      {sub && <p className="text-dark-500 text-xs mt-1">{sub}</p>}
    </div>
  );
}

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: barbershop } = await supabase
    .from("barbershops")
    .select("id, name")
    .eq("owner_id", user.id)
    .single();

  if (!barbershop) redirect("/onboarding");

  const { data: rows } = await supabase.rpc("get_barbershop_analytics", {
    p_barbershop_id: barbershop.id,
    p_days: 30,
  });

  const stats = rows ?? [];

  const totals = stats.reduce(
    (acc, r) => ({
      customers: acc.customers + (r.total_customers ?? 0),
      done: acc.done + (r.total_done ?? 0),
      skip: acc.skip + (r.total_skip ?? 0),
    }),
    { customers: 0, done: 0, skip: 0 }
  );

  const completionRate =
    totals.customers > 0
      ? Math.round((totals.done / totals.customers) * 100)
      : 0;

  const avgWaitArr = stats
    .map((r) => r.avg_wait_min)
    .filter((v): v is number => v !== null && v !== undefined);
  const avgWait =
    avgWaitArr.length > 0
      ? Math.round(avgWaitArr.reduce((a, b) => a + b, 0) / avgWaitArr.length)
      : 0;

  // Last 14 days for bar chart
  const chartData = stats.slice(0, 14).reverse();
  const maxCustomers = Math.max(...chartData.map((r) => r.total_customers ?? 0), 1);

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-white mb-1">Analitik</h1>
        <p className="text-dark-400 text-sm">30 hari terakhir</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Pelanggan" value={fmt(totals.customers)} sub="30 hari" />
        <StatCard label="Selesai Dilayani" value={fmt(totals.done)} sub="30 hari" />
        <StatCard
          label="Tingkat Penyelesaian"
          value={`${completionRate}%`}
          sub={`${totals.skip} dilewati`}
        />
        <StatCard
          label="Rata-rata Tunggu"
          value={avgWait > 0 ? `${avgWait} mnt` : "—"}
          sub="sebelum dipanggil"
        />
      </div>

      {chartData.length > 0 && (
        <div className="bg-dark-800/50 border border-dark-700/30 rounded-2xl p-6">
          <h2 className="font-semibold text-white mb-6">Pelanggan per Hari (14 hari terakhir)</h2>
          <div className="flex items-end gap-1 h-36">
            {chartData.map((r) => {
              const h = Math.round(((r.total_customers ?? 0) / maxCustomers) * 100);
              const label = new Date(r.date).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "short",
              });
              return (
                <div
                  key={r.date}
                  className="flex-1 flex flex-col items-center gap-1 group"
                >
                  <span className="text-dark-500 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                    {r.total_customers}
                  </span>
                  <div
                    className="w-full rounded-t-md bg-barber-400/60 hover:bg-barber-400 transition-colors"
                    style={{ height: `${Math.max(h, 2)}%` }}
                  />
                  <span className="text-dark-600 text-xs hidden lg:block">{label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {stats.length > 0 && (
        <div className="bg-dark-800/50 border border-dark-700/30 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-dark-700/30">
            <h2 className="font-semibold text-white">Detail per Hari</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dark-700/30">
                  <th className="text-left px-6 py-3 text-dark-400 font-medium">Tanggal</th>
                  <th className="text-right px-4 py-3 text-dark-400 font-medium">Masuk</th>
                  <th className="text-right px-4 py-3 text-dark-400 font-medium">Selesai</th>
                  <th className="text-right px-4 py-3 text-dark-400 font-medium">Skip</th>
                  <th className="text-right px-6 py-3 text-dark-400 font-medium">Tunggu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-700/20">
                {stats.map((r) => (
                  <tr key={r.date} className="hover:bg-dark-700/20 transition-colors">
                    <td className="px-6 py-3 text-dark-200">
                      {new Date(r.date).toLocaleDateString("id-ID", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                      })}
                    </td>
                    <td className="text-right px-4 py-3 text-white font-medium">
                      {r.total_customers}
                    </td>
                    <td className="text-right px-4 py-3 text-green-400">{r.total_done}</td>
                    <td className="text-right px-4 py-3 text-dark-500">{r.total_skip}</td>
                    <td className="text-right px-6 py-3 text-dark-400">
                      {r.avg_wait_min != null ? `${r.avg_wait_min} mnt` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {stats.length === 0 && (
        <div className="bg-dark-800/50 border border-dark-700/30 rounded-2xl p-12 text-center">
          <p className="text-dark-400">Belum ada data antrian dalam 30 hari terakhir</p>
        </div>
      )}
    </div>
  );
}

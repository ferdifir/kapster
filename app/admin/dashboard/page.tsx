import { createAdminClient } from "@/lib/supabase/admin";

function StatCard({ label, value, sub, accent }: { label: string; value: string | number; sub?: string; accent?: boolean }) {
  return (
    <div className={`p-6 rounded-2xl border ${accent ? "bg-barber-400/10 border-barber-400/30" : "bg-dark-800/50 border-dark-700/30"}`}>
      <p className="text-dark-400 text-sm mb-1">{label}</p>
      <p className={`font-display text-3xl font-bold ${accent ? "text-barber-400" : "text-white"}`}>{value}</p>
      {sub && <p className="text-dark-500 text-xs mt-1">{sub}</p>}
    </div>
  );
}

export default async function AdminDashboardPage() {
  const supabase = createAdminClient();

  const [
    { count: totalShops },
    { count: totalCustomers },
    { count: activeSubs },
    { data: pendingBookings },
    { data: monthlyRevenue },
  ] = await Promise.all([
    supabase.from("barbershops").select("*", { count: "exact", head: true }),
    supabase.from("queue_entries").select("*", { count: "exact", head: true }).eq("status", "done"),
    supabase.from("subscriptions").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("bookings").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("payments").select("amount").eq("status", "completed").gte("created_at", new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString()),
  ]);

  const totalRevenue = monthlyRevenue?.reduce((sum: number, p: { amount: number }) => sum + p.amount, 0) ?? 0;

  const today = new Date().toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-white mb-1">Admin Dashboard</h1>
        <p className="text-dark-400 text-sm">{today}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <StatCard label="Total Barbershops" value={totalShops ?? 0} accent />
        <StatCard label="Pelanggan Selesai" value={totalCustomers ?? 0} sub="semua waktu" />
        <StatCard label="Subscriber Aktif" value={activeSubs ?? 0} sub={`dari ${totalShops ?? 0} barbershop`} />
        <StatCard label="Revenue Bulan Ini" value={`Rp ${totalRevenue.toLocaleString("id-ID")}`} sub="dari payment completed" accent />
        <StatCard label="Booking Pending" value={pendingBookings?.length ?? 0} sub="perlu dikonfirmasi" />
      </div>

      <div className="bg-dark-800/50 border border-dark-700/30 rounded-2xl p-6">
        <h2 className="font-semibold text-white mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <a href="/admin/seo" className="px-4 py-2 rounded-xl bg-dark-700/50 text-dark-200 text-sm hover:bg-barber-400/10 hover:text-barber-400 transition-all">
            Trigger SEO Audit
          </a>
          <a href="/admin/sql" className="px-4 py-2 rounded-xl bg-dark-700/50 text-dark-200 text-sm hover:bg-barber-400/10 hover:text-barber-400 transition-all">
            SQL Query
          </a>
          <a href="/admin/system" className="px-4 py-2 rounded-xl bg-dark-700/50 text-dark-200 text-sm hover:bg-barber-400/10 hover:text-barber-400 transition-all">
            System Health
          </a>
        </div>
      </div>
    </div>
  );
}

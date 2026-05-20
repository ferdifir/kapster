import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

function StatCard({
  label,
  value,
  sub,
  icon,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div
      className={`p-6 rounded-2xl border ${
        accent
          ? "bg-barber-400/10 border-barber-400/30"
          : "bg-dark-800/50 border-dark-700/30"
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            accent ? "bg-barber-400/20" : "bg-dark-700/50"
          }`}
        >
          {icon}
        </div>
      </div>
      <p className="text-dark-400 text-sm mb-1">{label}</p>
      <p
        className={`font-display text-3xl font-bold ${
          accent ? "text-barber-400" : "text-white"
        }`}
      >
        {value}
      </p>
      {sub && <p className="text-dark-500 text-xs mt-1">{sub}</p>}
    </div>
  );
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: barbershop } = await supabase
    .from("barbershops")
    .select("id, name, slug")
    .eq("owner_id", user.id)
    .single();

  if (!barbershop) redirect("/onboarding");

  const today = new Date().toISOString().split("T")[0];

  const [{ data: todayQueue }, { data: barberCount }] =
    await Promise.all([
      supabase
        .from("queues")
        .select("id, is_open, total_served")
        .eq("barbershop_id", barbershop.id)
        .eq("date", today)
        .maybeSingle(),
      supabase
        .from("barbers")
        .select("id", { count: "exact" })
        .eq("barbershop_id", barbershop.id)
        .eq("is_active", true),
    ]);

  const waitingCount = todayQueue
    ? (
        await supabase
          .from("queue_entries")
          .select("id", { count: "exact" })
          .eq("queue_id", todayQueue.id)
          .eq("status", "waiting")
      ).count ?? 0
    : 0;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-white mb-1">
          Dashboard
        </h1>
        <p className="text-dark-400 text-sm">
          {new Date().toLocaleDateString("id-ID", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          label="Antrian Menunggu"
          value={waitingCount}
          sub={todayQueue?.is_open ? "Antrian buka" : "Antrian tutup"}
          accent={waitingCount > 0}
          icon={
            <svg
              className="w-5 h-5 text-barber-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0"
              />
            </svg>
          }
        />

        <StatCard
          label="Dilayani Hari Ini"
          value={todayQueue?.total_served ?? 0}
          sub="pelanggan selesai"
          icon={
            <svg
              className="w-5 h-5 text-dark-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          }
        />

        <StatCard
          label="Barber Aktif"
          value={barberCount?.length ?? 0}
          sub="tanpa batas"
          icon={
            <svg
              className="w-5 h-5 text-dark-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          }
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-dark-800/50 border border-dark-700/30 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-white">Akses Cepat</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { href: "/dashboard/queue", label: "Kelola Antrian", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0" },
              { href: "/dashboard/barbers", label: "Tambah Barber", icon: "M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" },
              { href: "/dashboard/services", label: "Layanan & Harga", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
              { href: "/dashboard/analytics", label: "Lihat Laporan", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
            ].map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-dark-700/30 border border-dark-700/30 hover:border-barber-400/30 hover:bg-barber-400/5 transition-all group"
              >
                <svg
                  className="w-6 h-6 text-dark-400 group-hover:text-barber-400 transition-colors"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d={item.icon}
                  />
                </svg>
                <span className="text-dark-300 text-xs text-center group-hover:text-white transition-colors">
                  {item.label}
                </span>
              </a>
            ))}
          </div>
        </div>

        <div className="bg-dark-800/50 border border-dark-700/30 rounded-2xl p-6">
          <h2 className="font-semibold text-white mb-5">Link Publik</h2>
          <div className="space-y-3">
            {[
              {
                label: "Halaman Antrian Customer",
                href: `/q/${barbershop.slug}`,
                desc: "Bagikan ke pelanggan untuk daftar antrian",
              },
              {
                label: "Halaman Booking",
                href: `/booking/${barbershop.slug}`,
                desc: "Untuk reservasi jadwal",
              },
              {
                label: "TV Display",
                href: `/display/${barbershop.slug}`,
                desc: "Tampilkan nomor antrian di TV",
              },
            ].map((link) => (
              <div
                key={link.label}
                className="flex items-start justify-between gap-3 p-3 rounded-xl bg-dark-700/30"
              >
                <div className="min-w-0">
                  <p className="text-dark-200 text-sm font-medium">{link.label}</p>
                  <p className="text-dark-500 text-xs">{link.desc}</p>
                </div>
                <a
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 p-1.5 rounded-lg text-dark-400 hover:text-barber-400 hover:bg-barber-400/10 transition-colors"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

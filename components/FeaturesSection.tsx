const features = [
  {
    icon: "M6 6h15l-2 8H8L6 3H3M9 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2ZM18 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z",
    title: "Antrian Digital Real-Time",
    desc: "Pelanggan bisa lihat posisi antrian langsung dari HP. Nggak perlu nongkrong lama di kursi tunggu.",
  },
  {
    icon: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM3 12h18M12 3c2.2 2.4 3.4 5.4 3.4 9S14.2 18.6 12 21M12 3c-2.2 2.4-3.4 5.4-3.4 9S9.8 18.6 12 21",
    title: "Booking & Reservasi",
    desc: "Sistem booking online dengan pilihan barber, jadwal, dan layanan yang diinginkan.",
  },
  {
    icon: "M4 5h16v10H7l-3 3V5Z",
    title: "Notifikasi WhatsApp",
    desc: "Otomatis kirim notifikasi ke pelanggan saat gilirannya hampir tiba via WhatsApp!",
  },
  {
    icon: "M4 19V9m5 10V5m5 14v-7m5 7V8M3 19h18",
    title: "Dashboard & Laporan",
    desc: "Pantau performa barber, pendapatan harian, dan statistik pelanggan dari satu layar.",
  },
  {
    icon: "M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM16 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM4 20a4 4 0 0 1 8 0M12 20a4 4 0 0 1 8 0",
    title: "Multi-Barber Support",
    desc: "Kelola beberapa barber sekaligus dengan sistem pembagian antrian yang adil dan transparan.",
  },
];

export default function FeaturesSection() {
  return (
    <section id="fitur" className="relative overflow-hidden bg-[#090908] py-20 sm:py-24">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_15%,rgba(245,158,11,0.10),transparent_30%)]" />

      <div className="relative mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <div className="inline-flex rounded-full border border-barber-300/20 bg-barber-300/10 px-3 py-1.5 text-xs font-semibold text-barber-200">
            Fitur Lengkap
          </div>
          <h2 className="mt-5 font-display text-3xl font-bold tracking-tight text-white sm:text-5xl">
            Semua yang Salon Pria <span className="text-barber-300">Butuhkan</span>
          </h2>
          <p className="mt-5 max-w-2xl text-sm leading-7 text-dark-400 sm:text-base">
            Dari antrian digital hingga laporan keuangan, semua ada dalam satu platform yang terasa cepat, rapi, dan siap dipakai tim barber.
          </p>
        </div>

        <div className="mt-12 grid gap-5 lg:grid-cols-12">
          <div className="rounded-[2rem] border border-barber-300/15 bg-gradient-to-br from-barber-300/10 to-white/[0.035] p-7 lg:col-span-5">
            <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-2xl bg-barber-300/10 text-barber-200 ring-1 ring-barber-300/20">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={features[0].icon} />
              </svg>
            </div>
            <h3 className="font-display text-2xl font-bold text-white">{features[0].title}</h3>
            <p className="mt-4 text-sm leading-7 text-dark-400">{features[0].desc}</p>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-7 lg:col-span-7">
            <div className="grid gap-6 sm:grid-cols-5">
              <div className="sm:col-span-3">
                <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-2xl bg-barber-300/10 text-barber-200 ring-1 ring-barber-300/20">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={features[1].icon} />
                  </svg>
                </div>
                <h3 className="font-display text-2xl font-bold text-white">{features[1].title}</h3>
                <p className="mt-4 text-sm leading-7 text-dark-400">{features[1].desc}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/25 p-4 sm:col-span-2">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-dark-500">Slot Hari Ini</p>
                <div className="mt-4 space-y-2">
                  <div className="rounded-xl bg-emerald-400/10 px-3 py-2 text-xs text-emerald-200">10:30 tersedia</div>
                  <div className="rounded-xl bg-barber-400/10 px-3 py-2 text-xs text-barber-200">14:30 hampir penuh</div>
                  <div className="rounded-xl bg-white/5 px-3 py-2 text-xs text-dark-400">19:00 premium cut</div>
                </div>
              </div>
            </div>
          </div>

          {features.slice(2).map((f) => (
            <div key={f.title} className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-7 lg:col-span-4">
              <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-2xl bg-barber-300/10 text-barber-200 ring-1 ring-barber-300/20">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={f.icon} />
                </svg>
              </div>
              <h3 className="font-display text-xl font-bold text-white">{f.title}</h3>
              <p className="mt-4 text-sm leading-7 text-dark-400">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

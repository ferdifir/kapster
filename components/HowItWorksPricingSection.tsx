const steps = [
  {
    num: "01",
    title: "Pelanggan pilih layanan",
    desc: "Mereka masuk antrian dari kasir, QR, atau link booking. Layanan dan barber tercatat sejak awal.",
  },
  {
    num: "02",
    title: "Barber ambil antrian",
    desc: "Status layanan bergerak real-time. Tim tahu siapa yang sedang dilayani, menunggu, atau selesai.",
  },
  {
    num: "03",
    title: "Owner membaca laporan",
    desc: "Pendapatan, jam ramai, layanan favorit, dan performa barber tersaji dalam dashboard yang mudah dipahami.",
  },
];

const PRICING_FEATURES = [
  { label: "Antrian digital real-time" },
  { label: "Booking dan reservasi online" },
  { label: "Dashboard performa harian" },
  { label: "Notifikasi WhatsApp" },
];

export default function HowItWorksPricingSection() {
  return (
    <section id="cara-kerja" className="relative overflow-hidden bg-[#070706] py-20 sm:py-24">
      <div className="absolute right-10 top-20 h-72 w-72 rounded-full bg-barber-500/10 blur-3xl" />
      <div className="relative mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-12 lg:items-start">
          <div className="lg:col-span-7">
            <div className="inline-flex rounded-full border border-barber-300/20 bg-barber-300/10 px-3 py-1.5 text-xs font-semibold text-barber-200">
              Cara Kerja
            </div>
            <h2 className="mt-5 font-display text-3xl font-bold tracking-tight text-white sm:text-5xl">
              Operasional Rapi dalam <span className="text-barber-300">Tiga Gerakan</span>
            </h2>

            <div className="mt-10 space-y-4">
              {steps.map((s, i) => (
                <div
                  key={s.num}
                  className={`rounded-[2rem] border border-white/10 bg-white/[0.035] p-6 ${
                    i === 1 ? "lg:ml-10" : i === 2 ? "lg:ml-20" : ""
                  }`}
                >
                  <div className="flex gap-5">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-barber-300 text-sm font-black text-dark-950">
                      {s.num}
                    </span>
                    <div>
                      <h3 className="font-display text-xl font-bold text-white">{s.title}</h3>
                      <p className="mt-2 text-sm leading-7 text-dark-400">{s.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div id="harga" className="lg:col-span-5">
            <div className="rounded-[2rem] border border-barber-300/20 bg-gradient-to-br from-barber-300/12 via-white/[0.04] to-white/[0.02] p-7 shadow-2xl shadow-barber-500/10">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-barber-200">
                Harga
              </p>
              <h3 className="mt-4 font-display text-3xl font-bold text-white">
                Mulai dari paket yang mudah dicoba.
              </h3>
              <p className="mt-4 text-sm leading-7 text-dark-400">
                Rp10.000/bulan — cancel kapan saja. Bayar sekali, pakai 30 hari penuh.
              </p>

              <div className="mt-8 rounded-3xl border border-white/10 bg-black/25 p-6">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-sm text-dark-400">Paket Starter</p>
                    <p className="mt-2 font-display text-4xl font-bold text-white">
                      Rp10.000
                      <span className="text-sm font-medium text-dark-500">/bulan</span>
                    </p>
                  </div>
                  <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                    Semua fitur
                  </span>
                </div>
                <ul className="mt-6 space-y-3 text-sm text-dark-300">
                  {PRICING_FEATURES.map((f) => (
                    <li key={f.label} className="flex gap-3">
                      <span className="text-barber-300">✓</span>
                      <span>{f.label}</span>
                    </li>
                  ))}
                </ul>
                <a
                  href="/auth/register"
                  className="mt-7 inline-flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-barber-300 to-barber-600 px-6 py-4 text-sm font-bold text-dark-950 shadow-xl shadow-barber-500/20 transition duration-300 hover:-translate-y-1"
                >
                  Mulai Sekarang
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

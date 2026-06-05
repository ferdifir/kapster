export default function HeroSection() {
  const brands = ["Gentlemen's", "RoyalCut", "The Barbers", "UrbanFade", "KingsMan", "SharpEdge"];

  return (
    <section className="relative overflow-hidden bg-[#070706] py-20 sm:py-24 lg:py-28">
      <div className="absolute left-1/2 top-0 h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-barber-500/10 blur-3xl" />
      <div className="absolute right-0 top-24 h-96 w-96 rounded-full bg-barber-700/10 blur-3xl" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(245,158,11,0.10),transparent_28%),linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[length:auto,34px_34px,34px_34px]" />

      <div className="relative mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-5">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 text-xs font-medium text-emerald-200">
              <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-lg shadow-emerald-300/40" />
              <span>Sudah dipercaya oleh ribuan salon pria di Indonesia</span>
            </div>

            <h1 className="font-display text-3xl font-bold leading-[0.95] tracking-tight text-white sm:text-5xl lg:text-7xl">
              Kelola <span className="text-transparent bg-clip-text bg-gradient-to-r from-barber-200 via-barber-400 to-barber-500">Antrian</span>
              <br />
              Salon Pria Makin <span className="text-transparent bg-clip-text bg-gradient-to-r from-barber-200 via-barber-400 to-barber-500">Profesional</span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-8 text-dark-400">
              Sistem manajemen antrian digital yang bikin pelanggan setia, barber produktif, dan bisnis makin cuan. Tanpa ribet, tanpa drama.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href="#harga"
                className="group inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-barber-300 to-barber-600 px-6 py-4 text-sm font-bold text-dark-950 shadow-2xl shadow-barber-500/20 transition duration-300 hover:-translate-y-1 hover:shadow-barber-500/30"
              >
                Mulai Sekarang
                <svg className="ml-2 h-4 w-4 transition duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14m-6-6 6 6-6 6" />
                </svg>
              </a>
              <a
                href="https://wa.me/62881027979168?text=demo"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-4 text-sm font-semibold text-white backdrop-blur transition duration-300 hover:border-barber-300/30 hover:bg-white/[0.06]"
              >
                Request Demo
              </a>
            </div>

            <div className="mt-10 grid grid-cols-3 gap-4 border-y border-white/10 py-6">
              <div>
                <p className="font-display text-2xl font-bold text-barber-300">500+</p>
                <p className="mt-1 text-xs text-dark-500">Salon Pria</p>
              </div>
              <div>
                <p className="font-display text-2xl font-bold text-barber-300">Ribuan</p>
                <p className="mt-1 text-xs text-dark-500">Pelanggan</p>
              </div>
              <div>
                <p className="font-display text-2xl font-bold text-barber-300">Terpercaya</p>
                <p className="mt-1 text-xs text-dark-500">Indonesia</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="group relative mx-auto max-w-2xl rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/[0.10] to-white/[0.03] p-3 shadow-2xl shadow-black/60 backdrop-blur-xl transition-all duration-500 hover:-translate-y-2 hover:scale-[1.02] hover:shadow-barber-500/20 lg:rotate-1">
              <div className="absolute -left-10 top-14 hidden h-28 w-28 rounded-3xl border border-barber-300/20 bg-barber-400/10 shadow-2xl shadow-barber-400/10 backdrop-blur-xl lg:block" />
              <div className="absolute -right-8 bottom-14 hidden h-36 w-36 rounded-full border border-emerald-300/20 bg-emerald-400/10 blur-sm lg:block" />

              <div className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#11110f]">
                <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.03] px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-barber-300 to-barber-600 text-dark-950">
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-display text-sm font-semibold text-white">Kapster Dashboard</p>
                      <p className="text-xs text-dark-500">Senin, 15 Mei 2026</p>
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                    <span className="h-2.5 w-2.5 rounded-full bg-barber-400" />
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                  </div>
                </div>

                <div className="space-y-3 p-5">
                  <div className="rounded-2xl border border-barber-300/20 bg-barber-300/10 p-4 shadow-lg shadow-barber-500/10">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <span className="rounded-xl bg-barber-300 px-3 py-2 text-xs font-black text-dark-950">01</span>
                        <div>
                          <p className="text-sm font-semibold text-white">Ahmad Fauzi</p>
                          <p className="text-xs text-dark-400">Haircut + Beard Trim — Barber: Rizky</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-semibold text-emerald-300">Sedang Dilayani</p>
                        <p className="mt-1 text-xs text-barber-200">14:30</p>
                      </div>
                    </div>
                  </div>

                  {[
                    { num: "02", name: "Budi Santoso", service: "Haircut — Barber: Dimas", time: "14:45" },
                    { num: "03", name: "Cahya Pratama", service: "Hair Spa — Barber: Ilham", time: "15:00" },
                  ].map((q) => (
                    <div key={q.num} className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <span className="rounded-xl bg-white/10 px-3 py-2 text-xs font-black text-dark-300">
                            {q.num}
                          </span>
                          <div>
                            <p className="text-sm font-semibold text-white">{q.name}</p>
                            <p className="text-xs text-dark-500">{q.service}</p>
                          </div>
                        </div>
                        <p className="text-xs text-dark-500">{q.time}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-3 border-t border-white/10 bg-black/20 p-5 text-center">
                  <div>
                    <p className="font-display text-lg font-bold text-barber-300">12</p>
                    <p className="text-[0.65rem] text-dark-500">Antrian</p>
                  </div>
                  <div>
                    <p className="font-display text-lg font-bold text-barber-300">4</p>
                    <p className="text-[0.65rem] text-dark-500">Menunggu</p>
                  </div>
                  <div>
                    <p className="font-display text-lg font-bold text-emerald-300">8</p>
                    <p className="text-[0.65rem] text-dark-500">Selesai</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 text-center">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.35em] text-dark-600">
                Dipercaya oleh barbershop terkemuka
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm font-semibold text-dark-500 sm:gap-x-10">
                {brands.map((b) => (
                  <span key={b}>{b}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

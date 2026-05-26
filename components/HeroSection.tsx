export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center noise bg-dark-950 overflow-hidden pt-24 pb-20 lg:py-0">
      <div className="absolute inset-0 line-pattern" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-barber-400/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-barber-600/5 rounded-full blur-3xl" />

      <div className="hidden lg:block absolute left-8 top-1/4 w-3 h-64 rounded-full barber-pole opacity-40 animate-float" />
      <div className="hidden lg:block absolute right-8 top-1/3 w-3 h-48 rounded-full barber-pole opacity-40 animate-float-delay" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="text-center lg:text-left">
            {/* PERBAIKAN: Menggunakan max-w-full dan flex-wrap/break-words agar tidak meluber di layar super kecil */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-dark-800/80 border border-dark-700/50 mb-6 max-w-full">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse flex-shrink-0" />
              <span className="text-dark-300 text-[11px] sm:text-sm font-medium break-words leading-tight text-left sm:text-center">
                Sudah dipercaya oleh ribuan salon pria di Indonesia
              </span>
            </div>

            {/* PERBAIKAN: Mengecilkan ukuran font terkecil dari text-3xl ke text-2xl/text-3xl bersyarat agar muat di layar < 360px */}
            <h1 className="font-display text-2xl xs:text-3xl sm:text-4xl lg:text-5xl xl:text-7xl font-black leading-tight mb-4 sm:mb-6 break-words">
              Kelola
              <span className="text-gold-gradient"> Antrian </span>
              Salon Pria
              <br className="hidden xs:block" />{" "}
              {/* Mencegah patahan aneh di layar super sempit */}
              Makin
              <span className="text-gold-gradient"> Gacor</span>
            </h1>

            <p className="text-dark-300 text-sm sm:text-lg lg:text-xl leading-relaxed mb-6 sm:mb-8 max-w-xl mx-auto lg:mx-0">
              Sistem manajemen antrian digital yang bikin pelanggan setia,
              barber produktif, dan bisnis makin cuan. Tanpa ribet, tanpa drama.
            </p>

            {/* PERBAIKAN: Menggunakan grid di mobile (1 kolom) agar tinggi kedua tombol konsisten dan tidak berantakan */}
            <div className="grid grid-cols-1 xs:flex xs:flex-row gap-3 sm:gap-4 w-full sm:w-auto justify-center lg:justify-start mb-10">
              <a
                href="#harga"
                className="group relative inline-flex items-center justify-center gap-2 px-5 py-3 sm:px-6 sm:py-3.5 rounded-xl gold-gradient text-dark-900 font-bold text-sm sm:text-lg transition-all duration-300 hover:shadow-2xl hover:shadow-barber-400/25 hover:-translate-y-0.5 w-full xs:w-auto"
              >
                Mulai Gratis
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
              </a>
              <a
                href="#cara-kerja"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 sm:px-6 sm:py-3.5 rounded-xl border border-dark-600 text-dark-200 font-semibold text-sm sm:text-lg hover:border-barber-400/50 hover:text-barber-400 transition-all duration-300 w-full xs:w-auto"
              >
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Lihat Demo
              </a>
            </div>

            <div className="flex flex-row flex-nowrap items-center justify-center lg:justify-start gap-x-3 xs:gap-x-4 sm:gap-x-8 max-w-full overflow-hidden">
              {[
                { value: "500+", label: "Salon Pria" },
                { value: "Ribuan", label: "Pelanggan" },
                { value: "Terpercaya", label: "Indonesia" },
              ].map((stat, i) => (
                <div
                  key={stat.label}
                  className="flex items-center gap-x-3 xs:gap-x-4 sm:gap-x-8 flex-shrink-0"
                >
                  {/* Garis pembatas vertikal: Mengecil gap-nya di mobile agar hemat ruang */}
                  {i > 0 && (
                    <div className="w-px h-8 sm:h-12 bg-dark-700/50 sm:bg-dark-700 flex-shrink-0" />
                  )}

                  {/* min-w-0 memastikan flexbox tidak rusak oleh whitespace-nowrap */}
                  <div className="min-w-0">
                    {/* PERBAIKAN FONT: Di mobile (paling kecil) font-nya text-base (16px), xs text-lg, sm dst kembali besar */}
                    <div className="font-display text-base xs:text-lg sm:text-2xl lg:text-3xl font-bold text-gold-gradient whitespace-nowrap truncate">
                      {stat.value}
                    </div>
                    {/* PERBAIKAN FONT LABEL: Di mobile text-[10px], sm dst text-sm */}
                    <div className="text-dark-400 text-[10px] sm:text-sm mt-0.5 whitespace-nowrap truncate">
                      {stat.label}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative px-2 sm:px-6 lg:px-0 mt-8 lg:mt-0">
            <div className="relative animate-float">
              <div className="bg-dark-800/90 backdrop-blur-xl rounded-2xl border border-dark-700/50 p-4 sm:p-6 shadow-2xl shadow-black/50">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg gold-gradient flex items-center justify-center flex-shrink-0">
                      <svg
                        className="w-5 h-5 text-dark-900"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                        />
                      </svg>
                    </div>
                    <div>
                      <div className="font-semibold text-white text-sm">
                        Kapster Dashboard
                      </div>
                      <div className="text-dark-400 text-xs">
                        Senin, 15 Mei 2026
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 sm:gap-4 p-3 rounded-xl bg-barber-400/10 border border-barber-400/20">
                    <div className="w-8 h-8 rounded-lg gold-gradient flex items-center justify-center text-dark-900 font-bold text-sm flex-shrink-0">
                      01
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-white font-semibold text-sm truncate">
                          Ahmad Fauzi
                        </span>
                        <span className="flex-shrink-0 px-2 py-0.5 rounded-full bg-green-400/20 text-green-400 text-[10px] sm:text-xs font-medium">
                          Sedang Dilayani
                        </span>
                      </div>
                      <div className="text-dark-400 text-xs mt-0.5 truncate">
                        Haircut + Beard Trim — Barber: Rizky
                      </div>
                    </div>
                    <div className="text-barber-400 font-mono text-sm font-bold flex-shrink-0">
                      14:30
                    </div>
                  </div>

                  {[
                    {
                      num: "02",
                      name: "Budi Santoso",
                      service: "Haircut — Barber: Dimas",
                      time: "14:45",
                    },
                    {
                      num: "03",
                      name: "Cahya Pratama",
                      service: "Full Service — Barber: Rizky",
                      time: "15:00",
                    },
                    {
                      num: "04",
                      name: "David Kurniawan",
                      service: "Haircut + Coloring — Barber: Andi",
                      time: "15:15",
                    },
                  ].map((q) => (
                    <div
                      key={q.num}
                      className="flex items-center gap-3 sm:gap-4 p-3 rounded-xl bg-dark-900/50 border border-dark-700/30"
                    >
                      <div className="w-8 h-8 rounded-xl bg-dark-700 flex items-center justify-center text-dark-300 font-bold text-sm flex-shrink-0">
                        {q.num}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-white font-semibold text-sm truncate">
                          {q.name}
                        </div>
                        <div className="text-dark-400 text-xs mt-0.5 truncate">
                          {q.service}
                        </div>
                      </div>
                      <div className="text-dark-400 font-mono text-sm flex-shrink-0">
                        {q.time}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-3 gap-2 sm:gap-3 mt-6 pt-6 border-t border-dark-700/30">
                  {[
                    { val: "12", label: "Hari Ini", color: "text-barber-400" },
                    { val: "4", label: "Menunggu", color: "text-barber-400" },
                    { val: "8", label: "Selesai", color: "text-green-400" },
                  ].map((s) => (
                    <div key={s.label} className="text-center">
                      <div
                        className={`${s.color} font-display text-xl sm:text-2xl font-bold`}
                      >
                        {s.val}
                      </div>
                      <div className="text-dark-400 text-[10px] sm:text-xs mt-0.5">
                        {s.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* PERBAIKAN: Menambahkan flex-wrap/max-w-full agar badge absolute aman di layar sempit */}
              <div className="absolute -top-6 -right-1 sm:-right-4 bg-dark-800 border border-dark-700/50 rounded-xl p-2.5 sm:p-3 shadow-xl animate-pulse-slow z-20 max-w-[180px] sm:max-w-none">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-green-400/20 flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-4 h-4 text-green-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <div className="text-white text-[11px] sm:text-xs font-semibold truncate">
                      Pelanggan #1 Selesai
                    </div>
                    <div className="text-dark-400 text-[9px] sm:text-xs">
                      Baru saja
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-6 -left-1 sm:-left-4 bg-dark-800 border border-dark-700/50 rounded-xl p-2.5 sm:p-4 shadow-xl animate-float-delay z-20 max-w-[150px] sm:max-w-none">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-xl bg-barber-400/20 flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-4 h-4 sm:w-5 sm:h-5 text-barber-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                      />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <div className="text-barber-400 font-bold text-xs sm:text-lg truncate">
                      +Produktif
                    </div>
                    <div className="text-dark-400 text-[9px] sm:text-xs truncate">
                      Kinerja Barber
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-dark-950 to-transparent p-0 pointer-events-none" />
    </section>
  );
}

const problems = [
  {
    icon: "M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
    title: "Pelanggan Nunggu Lama",
    desc: "Tanpa estimasi waktu, pelanggan bete dan pergi tanpa balik lagi. Kapster memberi urutan dan status yang jelas sejak mereka datang.",
  },
  {
    icon: "M8 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM16 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM4 20a4 4 0 0 1 8 0M12 20a4 4 0 0 1 8 0",
    title: "Antrian Berantakan",
    desc: "Saling serobot, nggak jelas siapa duluan, barber pun jadi bingung saat jam ramai.",
  },
  {
    icon: "M5 19V9m7 10V5m5 14v-7M3 19h18",
    title: "Nggak Ada Data",
    desc: "Nggak tahu jam sibuk, barber paling produktif, atau pendapatan harian yang benar-benar terbaca.",
  },
];

export default function ProblemSection() {
  return (
    <section className="relative overflow-hidden bg-[#070706] py-20 sm:py-24">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      <div className="absolute left-0 top-1/3 h-80 w-80 rounded-full bg-red-500/10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex rounded-full border border-red-300/20 bg-red-400/10 px-3 py-1.5 text-xs font-semibold text-red-200">
            Masalah Klasik
          </div>
          <h2 className="mt-5 font-display text-3xl font-bold tracking-tight text-white sm:text-5xl">
            Masih Pakai Sistem Antrian <span className="text-red-300">Manual?</span>
          </h2>
          <p className="mt-5 text-sm leading-7 text-dark-400 sm:text-base">
            Banyak tempat potong rambut masih kehilangan pelanggan karena pengelolaan antrian
            yang berantakan. Saatnya berubah.
          </p>
        </div>

        <div className="mt-14 grid gap-5 lg:grid-cols-12">
          <div className="rounded-[2rem] border border-red-300/15 bg-gradient-to-br from-red-400/10 to-white/[0.03] p-7 shadow-2xl shadow-black/30 lg:col-span-5">
            <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl border border-red-300/20 bg-red-300/10 text-red-200">
              <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={problems[0].icon} />
              </svg>
            </div>
            <h3 className="font-display text-2xl font-bold text-white">{problems[0].title}</h3>
            <p className="mt-4 text-sm leading-7 text-dark-400">{problems[0].desc}</p>
          </div>

          <div className="grid gap-5 lg:col-span-7 sm:grid-cols-2">
            <div className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-7">
              <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl border border-red-300/20 bg-red-300/10 text-red-200">
                <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={problems[1].icon} />
                </svg>
              </div>
              <h3 className="font-display text-xl font-bold text-white">{problems[1].title}</h3>
              <p className="mt-4 text-sm leading-7 text-dark-400">{problems[1].desc}</p>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-7 sm:translate-y-8">
              <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl border border-red-300/20 bg-red-300/10 text-red-200">
                <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={problems[2].icon} />
                </svg>
              </div>
              <h3 className="font-display text-xl font-bold text-white">{problems[2].title}</h3>
              <p className="mt-4 text-sm leading-7 text-dark-400">{problems[2].desc}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const testimonials = [
  {
    quote:
      "Kapster sangat membantu mengatur antrian. Pelanggan jadi lebih sabar karena tahu posisi antrian mereka.",
    name: "Pemilik Salon Pria",
    role: "Jakarta",
    metric: "38%",
    metricLabel: "waktu tunggu turun",
  },
  {
    quote:
      "Sekarang semua barber bisa fokus pada layanan tanpa perlu takut ada yang melompat antrian. Sistemnya benar-benar transparan.",
    name: "Manajer Tempat Cukur",
    role: "Bandung",
    metric: null,
    metricLabel: null,
  },
  {
    quote:
      "Notifikasi WhatsApp-nya otomatis, pelanggan jadi tidak perlu menunggu di tempat. Sangat membantu operasional kami.",
    name: "Pemilik Salon Pria",
    role: "Surabaya",
    metric: null,
    metricLabel: null,
  },
];

export default function Testimonials() {
  return (
    <section id="testimoni" className="relative overflow-hidden bg-[#090908] py-20 sm:py-24">
      <div className="absolute left-1/4 top-0 h-80 w-80 rounded-full bg-barber-500/10 blur-3xl" />
      <div className="relative mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-5">
            <div className="inline-flex rounded-full border border-barber-300/20 bg-barber-300/10 px-3 py-1.5 text-xs font-semibold text-barber-200">
              Testimoni
            </div>
            <h2 className="mt-5 font-display text-3xl font-bold tracking-tight text-white sm:text-5xl">
              Dipakai tim barber yang ingin <span className="text-barber-300">lebih tenang</span>
            </h2>
            <p className="mt-5 text-sm leading-7 text-dark-400 sm:text-base">
              Kapster membantu salon pria mengurangi antrean kacau, mempercepat pelayanan, dan membuat owner punya data yang bisa dipercaya.
            </p>
          </div>

          <div className="grid gap-5 lg:col-span-7">
            <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-7">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-lg leading-8 text-dark-200">
                    &ldquo;{testimonials[0].quote}&rdquo;
                  </p>
                  <div className="mt-6">
                    <p className="font-display font-bold text-white">{testimonials[0].name}</p>
                    <p className="text-sm text-dark-500">{testimonials[0].role}</p>
                  </div>
                </div>
                <div className="shrink-0 rounded-2xl border border-barber-300/20 bg-barber-300/10 px-5 py-4 text-center">
                  <p className="font-display text-3xl font-bold text-barber-300">
                    {testimonials[0].metric}
                  </p>
                  <p className="mt-1 text-xs text-dark-500">{testimonials[0].metricLabel}</p>
                </div>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              {testimonials.slice(1).map((t) => (
                <div key={t.name} className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-7">
                  <p className="text-sm leading-7 text-dark-300">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                  <p className="mt-5 font-display font-bold text-white">{t.name}</p>
                  <p className="text-sm text-dark-500">{t.role}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

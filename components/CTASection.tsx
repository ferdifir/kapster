export default function CTASection() {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute inset-0 gold-gradient opacity-5" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-barber-400/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-barber-400/10 border border-barber-400/20 mb-8">
          <svg className="w-5 h-5 text-barber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span className="text-barber-400 text-sm font-semibold">Setup cuma 5 menit</span>
        </div>

        <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-black mb-6">
          Siap Bikin Barbershop Kamu
          <span className="text-gold-gradient"> Lebih Gacor</span>?
        </h2>
        <p className="text-dark-300 text-lg sm:text-xl max-w-2xl mx-auto mb-10">
          Bergabung dengan 500+ barbershop yang sudah transformasi sistem antriannya. Gratis 14 hari,
          tanpa kartu kredit.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="/auth/register"
            className="group relative inline-flex items-center justify-center gap-2 px-10 py-4 rounded-xl gold-gradient text-dark-900 font-bold text-lg transition-all duration-300 hover:shadow-2xl hover:shadow-barber-400/25 hover:-translate-y-0.5"
          >
            Mulai Gratis Sekarang
            <svg
              className="w-5 h-5 group-hover:translate-x-1 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </a>
        </div>

        <p className="text-dark-500 text-sm mt-6">
          Tanpa kartu kredit · Batal kapan saja · Setup instan
        </p>
      </div>
    </section>
  );
}

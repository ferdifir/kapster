export default function CTASection() {
  return (
    <section className="relative overflow-hidden bg-[#090908] py-20 sm:py-24">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-r from-barber-300/5 to-barber-600/5" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-barber-400/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-4xl px-5 sm:px-6 lg:px-8 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-barber-300/20 bg-barber-300/10 px-4 py-2">
          <svg className="w-5 h-5 text-barber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span className="text-barber-200 text-sm font-semibold">Setup cuma 5 menit</span>
        </div>

        <h2 className="mt-8 font-display text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-black mb-6">
          Siap Bikin Usaha Kamu
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-barber-200 via-barber-400 to-barber-500"> Lebih Profesional</span>?
        </h2>
        <p className="text-dark-400 text-lg sm:text-xl max-w-2xl mx-auto mb-10">
          Bergabung dengan ratusan salon pria yang sudah meningkatkan sistem antriannya.
          Rp10.000/bulan — cancel kapan saja.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="/auth/register"
            className="group relative inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-barber-300 to-barber-600 px-10 py-4 text-lg font-bold text-dark-950 shadow-2xl shadow-barber-500/20 transition duration-300 hover:-translate-y-1 hover:shadow-barber-500/30"
          >
            Mulai Sekarang
            <svg
              className="w-5 h-5 transition duration-300 group-hover:translate-x-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14m-6-6 6 6-6 6" />
            </svg>
          </a>
        </div>

        <p className="text-dark-500 text-sm mt-6">
          Sistem antrian digital · Setup 5 menit · Langsung pakai
        </p>
      </div>
    </section>
  );
}

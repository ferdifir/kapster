const features = [
  {
    icon: "M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z",
    title: "Antrian Digital Real-Time",
    desc: "Pelanggan bisa lihat posisi antrian langsung dari HP. Nggak perlu nongkrong lama.",
  },
  {
    icon: "M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9",
    title: "Booking & Reservasi",
    desc: "Sistem booking online dengan pilihan barber, jadwal, dan layanan yang diinginkan.",
  },
  {
    icon: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z",
    title: "Notifikasi WhatsApp",
    desc: "Otomatis kirim notifikasi ke pelanggan saat gilirannya hampir tiba. Via WhatsApp!",
  },
  {
    icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
    title: "Dashboard & Laporan",
    desc: "Pantau performa barber, pendapatan harian, dan statistik pelanggan dari satu dashboard.",
  },
  {
    icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
    title: "Multi-Barber Support",
    desc: "Kelola beberapa barber sekaligus dengan sistem pembagian antrian yang adil dan transparan.",
  },
  {
    icon: "M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
    title: "Customer Display",
    desc: "Tampilkan nomor antrian di TV monitor usahamu. Tampil keren, pelanggan happy.",
  },
];

export default function FeaturesSection() {
  return (
    <section id="fitur" className="py-24 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-dark-950 via-dark-900/50 to-dark-950" />
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <span className="inline-block px-4 py-1.5 rounded-full bg-barber-400/10 text-barber-400 text-sm font-semibold mb-4">
            Fitur Lengkap
          </span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
            Semua yang Salon Pria
            <span className="text-gold-gradient"> Butuhkan</span>
          </h2>
          <p className="text-dark-300 text-lg max-w-2xl mx-auto">
            Dari antrian digital hingga laporan keuangan, semua ada dalam satu platform.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((f) => (
            <div
              key={f.title}
              className="card-hover group p-8 rounded-2xl bg-dark-800/50 border border-dark-700/30 hover:border-barber-400/30"
            >
              <div className="w-14 h-14 rounded-2xl bg-barber-400/10 flex items-center justify-center mb-6 group-hover:bg-barber-400/20 transition-colors">
                <svg className="w-7 h-7 text-barber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={f.icon} />
                </svg>
              </div>
              <h3 className="font-semibold text-white text-xl mb-3">{f.title}</h3>
              <p className="text-dark-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const features = [
  {
    icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z",
    title: "Antrian Digital Real-Time",
    desc: "Pelanggan bisa lihat posisi antrian langsung dari HP. Nggak perlu nongkrong di barbershop.",
  },
  {
    icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
    title: "Booking & Reservasi",
    desc: "Sistem booking online dengan pilihan barber, jadwal, dan layanan yang diinginkan.",
  },
  {
    icon: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9",
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
    icon: "M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z",
    title: "Customer Display",
    desc: "Tampilkan nomor antrian di TV monitor barbershop. Tampil keren, pelanggan happy.",
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
            Semua yang Barbershop
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

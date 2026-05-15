const steps = [
  { num: "1", title: "Daftar Akun", desc: "Buat akun gratis dalam 30 detik. Nggak perlu kartu kredit.", featured: true },
  { num: "2", title: "Setup Barbershop", desc: "Tambahkan barber, layanan, dan harga. Sesuaikan kebutuhan.", featured: false },
  { num: "3", title: "Mulai Antrian", desc: "Pelanggan bisa daftar antrian langsung atau via WhatsApp.", featured: false },
  { num: "4", title: "Monitor & Cuan", desc: "Pantau dari dashboard, analisis data, dan tingkatkan pendapatan.", featured: false },
];

export default function HowItWorks() {
  return (
    <section id="cara-kerja" className="py-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <span className="inline-block px-4 py-1.5 rounded-full bg-barber-400/10 text-barber-400 text-sm font-semibold mb-4">
            Cara Kerja
          </span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
            Setup dalam
            <span className="text-gold-gradient"> 5 Menit</span>
          </h2>
          <p className="text-dark-300 text-lg max-w-2xl mx-auto">
            Nggak perlu install apapun. Cukup daftar, setup, dan langsung pakai. Semudah membalikkan telapak tangan.
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-8 relative">
          <div className="hidden md:block absolute top-16 left-[12.5%] right-[12.5%] h-0.5 bg-gradient-to-r from-barber-400/50 via-barber-400/20 to-barber-400/50" />

          {steps.map((s) => (
            <div key={s.num} className="text-center relative">
              <div
                className={`relative z-10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg ${
                  s.featured
                    ? "gold-gradient shadow-barber-400/20"
                    : "bg-dark-700 border-2 border-barber-400/30"
                }`}
              >
                <span
                  className={`font-display text-2xl font-bold ${
                    s.featured ? "text-dark-900" : "text-barber-400"
                  }`}
                >
                  {s.num}
                </span>
              </div>
              <h3 className="font-semibold text-white text-lg mb-3">{s.title}</h3>
              <p className="text-dark-400 text-sm">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

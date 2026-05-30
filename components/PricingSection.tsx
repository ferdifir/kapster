const FEATURES = [
  { label: "Manajemen Antrian", desc: "Antrian real-time dengan update otomatis" },
  { label: "Booking Online", desc: "Pelanggan bisa booking dari HP" },
  { label: "Notifikasi WhatsApp", desc: "Panggil antrian otomatis via WA" },
  { label: "Manajemen Barber", desc: "Kelola barber & layanan" },
  { label: "Dashboard Analitik", desc: "Laporan harian, mingguan, bulanan" },
  { label: "Tampilan TV Monitor", desc: "Display antrian di TV barbershop" },
];

export default function PricingSection() {
  return (
    <section id="harga" className="py-24 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-dark-950 via-dark-900/30 to-dark-950" />
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-barber-400/10 text-barber-400 text-sm font-semibold mb-4">
            Rp10.000 / bulan
          </span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
            Satu Harga, <span className="text-gold-gradient">Semua Fitur</span>
          </h2>
          <p className="text-dark-300 text-lg max-w-2xl mx-auto">
            Rp10.000/bulan — cancel kapan saja. Bayar sekali, pakai 30 hari penuh.
          </p>
        </div>

        <div className="max-w-sm mx-auto">
          <div className="p-8 rounded-2xl bg-dark-800/50 border border-dark-700/30 card-hover text-center">
            <p className="text-dark-400 text-sm mb-1">Mulai dari</p>
            <p className="font-display text-5xl font-bold text-white mb-6">
              Rp10.000
              <span className="text-lg text-dark-400 font-normal">/bulan</span>
            </p>
            <ul className="text-left space-y-4 mb-8">
              {FEATURES.map((f) => (
                <li key={f.label} className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-barber-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <div>
                    <p className="text-white font-medium text-sm">{f.label}</p>
                    <p className="text-dark-400 text-xs">{f.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
            <a
              href="/auth/register"
              className="block w-full px-6 py-3 rounded-xl gold-gradient text-dark-900 font-bold text-lg hover:shadow-lg hover:shadow-barber-400/25 transition-all duration-300"
            >
              Mulai Sekarang
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

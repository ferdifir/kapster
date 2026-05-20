const FEATURES = [
  { label: "Unlimited Barber", desc: "Kelola barber tanpa batas" },
  { label: "Unlimited Antrian", desc: "Antrian harian tanpa batas" },
  { label: "Queue Digital", desc: "Antrian online real-time" },
  { label: "Public Booking Page", desc: "Halaman booking untuk pelanggan" },
  { label: "TV Display", desc: "Tampilkan antrian di TV" },
];

export default function PricingSection() {
  return (
    <section id="harga" className="py-24 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-dark-950 via-dark-900/30 to-dark-950" />
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-barber-400/10 text-barber-400 text-sm font-semibold mb-4">
            100% Gratis
          </span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
            Semua Fitur<span className="text-gold-gradient"> Gratis</span>
          </h2>
          <p className="text-dark-300 text-lg max-w-2xl mx-auto">
            Tanpa biaya bulanan. Tanpa batasan tersembunyi. Langsung pakai.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f) => (
            <div
              key={f.label}
              className="p-6 rounded-2xl bg-dark-800/50 border border-dark-700/30 card-hover"
            >
              <div className="w-10 h-10 rounded-xl bg-barber-400/10 flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-barber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-white font-semibold mb-1">{f.label}</h3>
              <p className="text-dark-400 text-sm">{f.desc}</p>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <a
            href="/auth/register"
            className="inline-block px-8 py-3 rounded-xl gold-gradient text-dark-900 font-bold text-lg hover:shadow-lg hover:shadow-barber-400/25 transition-all duration-300"
          >
            Mulai Sekarang — Gratis
          </a>
        </div>
      </div>
    </section>
  );
}

const FEATURES = [
  { label: "3 Barber", desc: "Kelola hingga 3 tukang cukur" },
  { label: "50 Antrian/hari", desc: "Cukup untuk barbershop ramai" },
  { label: "Queue Digital", desc: "Antrian online real-time" },
  { label: "Public Booking Page", desc: "Halaman booking untuk pelanggan" },
  { label: "TV Display", desc: "Tampilkan antrian di TV" },
  // { label: "WhatsApp Notification", desc: "Notifikasi otomatis ke pelanggan" },
  // { label: "Basic Reports", desc: "Laporan harian dan mingguan" },
  // { label: "Custom Logo", desc: "Upload logo barbershop" },
  // { label: "Analytics Lengkap", desc: "Dashboard analytics mendalam" },
  // { label: "Priority Support", desc: "Dukungan prioritas" },
  // { label: "API Access", desc: "Akses API untuk integrasi" },
];

/* PRICING SECTION ASLI DINONAKTIFKAN
import { PLAN_KEYS, PLAN_META, formatLandingPrice, PLAN_AMOUNTS, PLAN_ANNUAL_AMOUNTS, getYearlySavings } from "@/lib/config/plans";

const CheckIcon = ({ included, featured }: { included: boolean; featured?: boolean }) =>
  included ? (
    <svg
      className={`w-5 h-5 mt-0.5 shrink-0 ${featured ? "text-barber-400" : "text-green-400"}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ) : (
    <svg className="w-5 h-5 mt-0.5 shrink-0 text-dark-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );

const CrossIcon = () => (
  <svg className="w-5 h-5 mt-0.5 shrink-0 text-dark-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

export default function PricingSectionOld() {
  return (
    <section id="harga" className="py-24 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-dark-950 via-dark-900/30 to-dark-950" />
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <span className="inline-block px-4 py-1.5 rounded-full bg-barber-400/10 text-barber-400 text-sm font-semibold mb-4">
            Harga
          </span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
           Harga Terjangkau untuk
            <span className="text-gold-gradient"> Barbershop Kecil</span>
          </h2>
          <p className="text-dark-300 text-lg max-w-2xl mx-auto">
            Mulai gratis. Upgrade ketika butuh lebih banyak fitur.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {PLAN_KEYS.map((key) => {
            const meta = PLAN_META[key];
            return (
            <div
              key={key}
              className={`card-hover relative p-8 rounded-2xl ${
                meta.featured
                  ? "bg-dark-800 border-2 border-barber-400/40 shadow-xl shadow-barber-400/10"
                  : "bg-dark-800/50 border border-dark-700/30"
              }`}
            >
              {meta.featured && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="px-4 py-1.5 rounded-full gold-gradient text-dark-900 text-sm font-bold">
                    Paling Populer
                  </span>
                </div>
              )}

              <div className="mb-8">
                <h3 className="font-semibold text-white text-xl mb-2">{meta.name}</h3>
                <p className="text-dark-400 text-sm">{meta.desc}</p>
              </div>

              <div className="mb-8">
                <span
                  className={`font-display text-5xl font-bold ${
                    meta.featured ? "text-gold-gradient" : "text-white"
                  }`}
                >
                  {formatLandingPrice(key)}
                </span>
                <span className="text-dark-400 text-sm">/bulan</span>
              </div>

              <ul className="space-y-4 mb-8">
                {meta.landingFeatures.map((f) => (
                  <li key={f.label} className="flex items-start gap-3">
                    <CheckIcon included={f.included} featured={meta.featured} />
                    <span className={`text-sm ${f.included ? "text-dark-300" : "text-dark-500"}`}>
                      {f.label}
                    </span>
                  </li>
                ))}
              </ul>

              <a
                href={meta.ctaHref}
                className={`block w-full py-3 rounded-xl font-semibold text-center transition-all duration-300 ${
                  meta.featured
                    ? "gold-gradient text-dark-900 font-bold hover:shadow-lg hover:shadow-barber-400/25"
                    : "border border-dark-600 text-dark-200 hover:border-barber-400/50 hover:text-barber-400"
                }`}
              >
                {meta.ctaLabel}
              </a>
            </div>
          )})}
        </div>
      </div>
    </section>
  );
}
*/

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

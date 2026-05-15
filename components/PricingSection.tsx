type Plan = {
  name: string;
  price: string;
  desc: string;
  features: { included: boolean; label: string }[];
  cta: string;
  href: string;
  featured?: boolean;
};

const plans: Plan[] = [
  {
    name: "Starter",
    price: "Rp0",
    desc: "Cocok untuk barbershop yang baru mulai.",
    features: [
      { included: true, label: "1 Barber" },
      { included: true, label: "30 Antrian/hari" },
      { included: true, label: "Dashboard Dasar" },
      { included: false, label: "Notifikasi WhatsApp" },
      { included: false, label: "Customer Display" },
    ],
    cta: "Mulai Gratis",
    href: "/auth/register",
  },
  {
    name: "Professional",
    price: "Rp149K",
    desc: "Untuk barbershop yang sudah berjalan serius.",
    features: [
      { included: true, label: "Hingga 5 Barber" },
      { included: true, label: "100 Antrian/hari" },
      { included: true, label: "Dashboard + Laporan Lengkap" },
      { included: true, label: "Notifikasi WhatsApp" },
      { included: true, label: "Customer Display (TV)" },
    ],
    cta: "Coba Gratis 14 Hari",
    href: "/auth/register",
    featured: true,
  },
  {
    name: "Enterprise",
    price: "Rp349K",
    desc: "Untuk chain barbershop dengan banyak cabang.",
    features: [
      { included: true, label: "Unlimited Barber" },
      { included: true, label: "Multi-Cabang" },
      { included: true, label: "Semua Fitur Pro" },
      { included: true, label: "API Access" },
      { included: true, label: "Support Priority 24/7" },
    ],
    cta: "Hubungi Sales",
    href: "https://wa.me/6285239110184?text=Halo%2C+saya+tertarik+dengan+paket+Enterprise+QueueBarber",
  },
];

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

export default function PricingSection() {
  return (
    <section id="harga" className="py-24 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-dark-950 via-dark-900/30 to-dark-950" />
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <span className="inline-block px-4 py-1.5 rounded-full bg-barber-400/10 text-barber-400 text-sm font-semibold mb-4">
            Harga
          </span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
            Investasi Kecil,
            <span className="text-gold-gradient"> Hasil Besar</span>
          </h2>
          <p className="text-dark-300 text-lg max-w-2xl mx-auto">
            Mulai gratis, upgrade kapan saja. Nggak ada kontrak jangka panjang.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`card-hover relative p-8 rounded-2xl ${
                plan.featured
                  ? "bg-dark-800 border-2 border-barber-400/40 shadow-xl shadow-barber-400/10"
                  : "bg-dark-800/50 border border-dark-700/30"
              }`}
            >
              {plan.featured && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="px-4 py-1.5 rounded-full gold-gradient text-dark-900 text-sm font-bold">
                    Paling Populer
                  </span>
                </div>
              )}

              <div className="mb-8">
                <h3 className="font-semibold text-white text-xl mb-2">{plan.name}</h3>
                <p className="text-dark-400 text-sm">{plan.desc}</p>
              </div>

              <div className="mb-8">
                <span
                  className={`font-display text-5xl font-bold ${
                    plan.featured ? "text-gold-gradient" : "text-white"
                  }`}
                >
                  {plan.price}
                </span>
                <span className="text-dark-400 text-sm">/bulan</span>
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((f) => (
                  <li key={f.label} className="flex items-start gap-3">
                    <CheckIcon included={f.included} featured={plan.featured} />
                    <span className={`text-sm ${f.included ? "text-dark-300" : "text-dark-500"}`}>
                      {f.label}
                    </span>
                  </li>
                ))}
              </ul>

              <a
                href={plan.href}
                className={`block w-full py-3 rounded-xl font-semibold text-center transition-all duration-300 ${
                  plan.featured
                    ? "gold-gradient text-dark-900 font-bold hover:shadow-lg hover:shadow-barber-400/25"
                    : "border border-dark-600 text-dark-200 hover:border-barber-400/50 hover:text-barber-400"
                }`}
              >
                {plan.cta}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

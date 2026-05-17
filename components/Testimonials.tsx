const testimonials = [
  {
    quote:
      "QueueBarber sangat membantu mengatur antrian. Pelanggan jadi lebih sabar karena tahu posisi antrian mereka.",
    name: "Pemilik Barbershop",
    role: "Jakarta",
    initial: "A",
  },
  {
    quote:
      "Sekarang semua barber bisa fokus pada layanan tanpa perlu takut ada yang跳过 antrian. Sistemnya benar-benar transparan.",
    name: "Manajer Barbershop",
    role: "Bandung",
    initial: "B",
  },
  {
    quote:
      "Notifikasi WhatsApp-nya otomatis, pelanggan jadi tidak perlu menunggu di tempat. Sangat membantu operasional kami.",
    name: "Barber Shop Owner",
    role: "Surabaya",
    initial: "C",
  },
];

const StarIcon = () => (
  <svg className="w-5 h-5 text-barber-400" fill="currentColor" viewBox="0 0 20 20">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);

export default function Testimonials() {
  return (
    <section id="testimoni" className="py-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <span className="inline-block px-4 py-1.5 rounded-full bg-barber-400/10 text-barber-400 text-sm font-semibold mb-4">
            Testimoni
          </span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
            Kata Mereka yang Sudah
            <span className="text-gold-gradient"> Coba</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((t) => (
            <div key={t.name} className="card-hover p-8 rounded-2xl bg-dark-800/50 border border-dark-700/30">
              <div className="flex gap-1 mb-6">
                {Array.from({ length: 5 }).map((_, i) => (
                  <StarIcon key={i} />
                ))}
              </div>
              <blockquote className="text-dark-300 leading-relaxed mb-6">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-barber-400/20 flex items-center justify-center">
                  <span className="text-barber-400 font-bold text-lg">{t.initial}</span>
                </div>
                <div>
                  <div className="text-white font-semibold">{t.name}</div>
                  <div className="text-dark-400 text-sm">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

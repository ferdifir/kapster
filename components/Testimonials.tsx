const testimonials = [
  {
    quote:
      "Sejak pakai QueueBarber, pelanggan kami naik 40%. Nggak ada lagi yang komplain soal nunggu lama. Notifikasi WA-nya sangat membantu!",
    name: "Rizky Pratama",
    role: "Owner, The Gentlemen's Cut",
    initial: "R",
  },
  {
    quote:
      "Dashboard-nya keren banget! Bisa lihat barber mana yang paling ramai, jam berapa paling sibuk. Jadi bisa atur jadwal dengan lebih efisien.",
    name: "Dimas Aditya",
    role: "Manager, Royal Cuts Barber",
    initial: "D",
  },
  {
    quote:
      "Kami punya 3 cabang dan QueueBarber bantu kelola semuanya dari satu tempat. Customer display di TV bikin barbershop kelihatan profesional banget!",
    name: "Andi Wijaya",
    role: "Owner, KingsMan Barbershop",
    initial: "A",
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

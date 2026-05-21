const problems = [
  {
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    ),
    title: "Pelanggan Nunggu Lama",
    desc: "Tanpa estimasi waktu, pelanggan bete dan pergi tanpa balik lagi.",
  },
  {
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    ),
    title: "Antrian Berantakan",
    desc: "Saling serobot, nggak jelas siapa duluan, barber pun jadi bingung.",
  },
  {
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    ),
    title: "Nggak Ada Data",
    desc: "Nggak tahu jam sibuk, barber paling produktif, atau pendapatan harian.",
  },
];

export default function ProblemSection() {
  return (
    <section className="py-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-red-400/10 text-red-400 text-sm font-semibold mb-4">
            Masalah Klasik
          </span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
            Masih Pakai Sistem Antrian
            <span className="text-red-400"> Manual</span>?
          </h2>
          <p className="text-dark-300 text-lg max-w-2xl mx-auto">
            Banyak tempat potong rambut masih kehilangan pelanggan karena pengelolaan antrian
            yang berantakan. Saatnya berubah.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {problems.map((p) => (
            <div key={p.title} className="text-center p-6">
              <div className="w-16 h-16 rounded-2xl bg-red-400/10 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {p.icon}
                </svg>
              </div>
              <h3 className="font-semibold text-white text-lg mb-2">{p.title}</h3>
              <p className="text-dark-400 text-sm">{p.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

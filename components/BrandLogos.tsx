const brands = ["Gentlemen's", "RoyalCut", "The Barbers", "UrbanFade", "KingsMan", "SharpEdge"];

export default function BrandLogos() {
  return (
    <section className="relative py-16 border-t border-dark-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-center text-dark-400 text-sm font-medium mb-10 uppercase tracking-wider">
          Dipercaya oleh barbershop terkemuka
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-8 opacity-40">
          {brands.map((b) => (
            <span key={b} className="font-display text-2xl font-bold text-dark-200">
              {b}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

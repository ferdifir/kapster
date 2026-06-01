import Logo from "./Logo";

const footerLinks = {
  Produk: [
    { label: "Fitur", href: "/#fitur" },
    { label: "Harga", href: "/#harga" },
    { label: "Tentang", href: "/about" },
  ],
  Dukungan: [
    { label: "Hubungi Sales", href: "https://wa.me/6285239110184?text=Halo%2C+saya+ingin+tahu+lebih+tentang+Kapster" },
    { label: "Masuk Dashboard", href: "/auth/login" },
  ],
  Legal: [
    { label: "Kebijakan Privasi", href: "/privacy-policy" },
    { label: "Syarat & Ketentuan", href: "/terms-of-service" },
    { label: "Kebijakan Cookie", href: "/cookie-policy" },
  ],
};

export default function Footer() {
  return (
    <footer className="border-t border-dark-800/50 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-12 mb-16">
          <div className="md:col-span-1">
            <a href="/" className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg gold-gradient flex items-center justify-center">
                <Logo className="w-6 h-6 text-dark-900" />
              </div>
              <span className="font-display text-xl font-bold text-white">
                Kapster
              </span>
            </a>
            <p className="text-dark-400 text-sm leading-relaxed">
              Sistem manajemen antrian digital #1 untuk barbershop di Indonesia. Bikin bisnis makin profesional.
            </p>
          </div>

          {Object.entries(footerLinks).map(([section, links]) => (
            <div key={section}>
              <h4 className="font-semibold text-white mb-4">{section}</h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className="text-dark-400 hover:text-barber-400 transition-colors text-sm">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-dark-800/50 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-dark-500 text-sm">© 2026 Kapster. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <a href="/about" className="text-dark-400 hover:text-barber-400 transition-colors text-sm">
              Tentang Kami
            </a>
            <a href="https://wa.me/6285239110184" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="text-dark-400 hover:text-barber-400 transition-colors">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

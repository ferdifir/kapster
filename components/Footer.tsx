import Link from "next/link";
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

const cols: Record<string, string> = {
  Produk: "lg:col-span-2",
  Dukungan: "lg:col-span-3",
  Legal: "lg:col-span-3",
};

export default function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-white/10 bg-[#070706] py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Link href="/" className="inline-flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-xl border border-barber-300/30 bg-gradient-to-br from-barber-300 to-barber-600 text-dark-950">
                <Logo className="h-5 w-5" />
              </span>
              <span className="font-display text-base font-semibold text-white">Kapster</span>
            </Link>
            <p className="mt-5 max-w-xs text-sm leading-7 text-dark-500">
              Sistem manajemen antrian digital #1 untuk barbershop di Indonesia. Bikin bisnis makin profesional.
            </p>
          </div>

          {Object.entries(footerLinks).map(([section, links]) => (
            <div key={section} className={cols[section]}>
              <h3 className="font-display text-sm font-semibold text-white">{section}</h3>
              <div className="mt-5 space-y-3 text-sm text-dark-500">
                {links.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    className="block transition hover:text-barber-200"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-white/10 pt-8 text-xs text-dark-600 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 Kapster. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <a href="/about" className="transition hover:text-barber-200">Tentang Kami</a>
            <a
              href="https://wa.me/6285239110184"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] transition hover:border-barber-300/30 hover:text-barber-200"
              aria-label="WhatsApp Kapster"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M5.2 18.8 6 15.6A7.4 7.4 0 1 1 8.4 18l-3.2.8Z" />
                <path d="M9.5 9.2c.2 2 2.1 4 4.3 4.7l1.4-1.2 1.5.8c.3.2.4.5.3.8-.3 1-1.1 1.6-2.2 1.5-3.1-.3-6.3-3.3-7-6.4-.2-1 .4-1.9 1.3-2.3.3-.1.7 0 .8.3l.8 1.5-1.2 1.3Z" fill="currentColor" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

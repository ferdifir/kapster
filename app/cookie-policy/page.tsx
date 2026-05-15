import type { Metadata } from "next";
import Link from "next/link";
import Logo from "@/components/Logo";

export const metadata: Metadata = {
  title: "Kebijakan Cookie",
  description: "Kebijakan Cookie QueueBarber — cookie apa yang kami gunakan dan mengapa.",
};

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-dark-950">
      <header className="border-b border-dark-800/50 px-4 py-5">
        <div className="max-w-3xl mx-auto">
          <Link href="/" className="inline-flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg gold-gradient flex items-center justify-center">
              <Logo className="w-4 h-4 text-dark-900" />
            </div>
            <span className="font-display text-lg font-bold text-white">
              Queue<span className="text-barber-400">Barber</span>
            </span>
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-16">
        <h1 className="font-display text-3xl font-bold text-white mb-2">Kebijakan Cookie</h1>
        <p className="text-dark-400 text-sm mb-12">Terakhir diperbarui: 15 Mei 2026</p>

        <div className="prose prose-invert prose-sm max-w-none space-y-10">

          <section>
            <h2 className="font-display text-xl font-semibold text-white mb-4">1. Apa itu Cookie?</h2>
            <p className="text-dark-300 leading-relaxed">
              Cookie adalah file teks kecil yang disimpan browser Anda saat mengunjungi sebuah website. Cookie membantu website mengingat preferensi dan status sesi Anda antar kunjungan.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-white mb-4">2. Cookie yang Kami Gunakan</h2>
            <p className="text-dark-300 leading-relaxed mb-4">
              QueueBarber hanya menggunakan cookie yang <strong className="text-white">diperlukan untuk operasional layanan</strong>. Kami tidak menggunakan cookie pelacak atau iklan.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-dark-700">
                    <th className="text-left py-2 pr-4 text-white font-semibold">Nama Cookie</th>
                    <th className="text-left py-2 pr-4 text-white font-semibold">Tujuan</th>
                    <th className="text-left py-2 text-white font-semibold">Masa Berlaku</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-800 text-dark-300">
                  <tr>
                    <td className="py-3 pr-4 font-mono text-xs">sb-*-auth-token</td>
                    <td className="py-3 pr-4">Menyimpan sesi login Anda (Supabase Auth)</td>
                    <td className="py-3">1 jam (refresh otomatis)</td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-4 font-mono text-xs">sb-*-auth-token-code-verifier</td>
                    <td className="py-3 pr-4">Verifikasi keamanan proses login (PKCE)</td>
                    <td className="py-3">Sesi browser</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-white mb-4">3. Cookie Pihak Ketiga</h2>
            <p className="text-dark-300 leading-relaxed">
              Kami tidak memasang cookie pihak ketiga untuk pelacakan atau analitik. Halaman pembayaran Pakasir (domain eksternal) mungkin menggunakan cookie mereka sendiri — silakan baca kebijakan privasi Pakasir untuk informasi lebih lanjut.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-white mb-4">4. Mengelola Cookie</h2>
            <p className="text-dark-300 leading-relaxed mb-3">
              Anda dapat menghapus atau memblokir cookie melalui pengaturan browser. Namun, menonaktifkan cookie autentikasi akan membuat Anda tidak bisa login ke dashboard.
            </p>
            <p className="text-dark-300 leading-relaxed">
              Petunjuk pengelolaan cookie di browser populer:
            </p>
            <ul className="list-disc list-inside space-y-1 text-dark-300 mt-2">
              <li>Chrome: Settings → Privacy &amp; Security → Cookies</li>
              <li>Firefox: Options → Privacy &amp; Security → Cookies and Site Data</li>
              <li>Safari: Preferences → Privacy → Manage Website Data</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-white mb-4">5. Kontak</h2>
            <p className="text-dark-300 leading-relaxed">
              Pertanyaan mengenai cookie:{" "}
              <a href="mailto:hi@queuebarber.my.id" className="text-barber-400 hover:text-barber-300">
                hi@queuebarber.my.id
              </a>
            </p>
          </section>

        </div>

        <div className="mt-16 pt-8 border-t border-dark-800/50 flex gap-6 text-sm">
          <Link href="/privacy-policy" className="text-dark-400 hover:text-barber-400 transition-colors">Kebijakan Privasi</Link>
          <Link href="/terms-of-service" className="text-dark-400 hover:text-barber-400 transition-colors">Syarat & Ketentuan</Link>
          <Link href="/" className="text-dark-400 hover:text-barber-400 transition-colors">Beranda</Link>
        </div>
      </main>
    </div>
  );
}

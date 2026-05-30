import type { Metadata } from "next";
import Link from "next/link";
import Logo from "@/components/Logo";

export const metadata: Metadata = {
  title: "Syarat & Ketentuan",
  description: "Syarat dan Ketentuan penggunaan layanan Kapster.",
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-dark-950">
      <header className="border-b border-dark-800/50 px-4 py-5">
        <div className="max-w-3xl mx-auto">
          <Link href="/" className="inline-flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg gold-gradient flex items-center justify-center">
              <Logo className="w-4 h-4 text-dark-900" />
            </div>
            <span className="font-display text-lg font-bold text-white">
              Kapster
            </span>
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-16">
        <h1 className="font-display text-3xl font-bold text-white mb-2">Syarat & Ketentuan</h1>
        <p className="text-dark-400 text-sm mb-12">Terakhir diperbarui: 15 Mei 2026</p>

        <div className="prose prose-invert prose-sm max-w-none space-y-10">

          <section>
            <h2 className="font-display text-xl font-semibold text-white mb-4">1. Penerimaan Syarat</h2>
            <p className="text-dark-300 leading-relaxed">
               Dengan mendaftar atau menggunakan Kapster, Anda menyatakan telah membaca, memahami, dan setuju terikat oleh syarat dan ketentuan ini. Jika tidak setuju, jangan gunakan layanan kami.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-white mb-4">2. Deskripsi Layanan</h2>
            <p className="text-dark-300 leading-relaxed mb-3">
               Kapster adalah platform manajemen antrian digital untuk barbershop yang mencakup:
            </p>
            <ul className="list-disc list-inside space-y-1 text-dark-300 leading-relaxed mb-3">
              <li>Antrian digital real-time dengan tampilan publik</li>
              <li>Sistem booking dan reservasi online</li>
              <li>Notifikasi otomatis via WhatsApp</li>
              <li>Dashboard operasional dan laporan statistiques</li>
              <li>Dukungan multi-barber dengan pembagian antrian yang adil</li>
              <li>Customer display untuk TV monitor</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-white mb-4">3. Akun Pengguna</h2>
            <ul className="list-disc list-inside space-y-2 text-dark-300 leading-relaxed">
              <li>Anda bertanggung jawab menjaga kerahasiaan kredensial akun Anda</li>
              <li>Satu akun untuk satu entitas bisnis. Berbagi akun antar bisnis berbeda tidak diizinkan</li>
              <li>Anda wajib memberikan informasi yang akurat dan terkini saat mendaftar</li>
              <li>Segera beri tahu kami jika mendeteksi akses tidak sah ke akun Anda</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-white mb-4">4. Paket Langganan & Pembayaran</h2>
<div className="space-y-4 text-dark-300 leading-relaxed">
              <p>Kapster menawarkan satu paket langganan: <strong className="text-white">Rp10.000/bulan</strong> — satu harga untuk semua fitur.</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Manajemen antrian real-time</li>
                <li>Booking online</li>
                <li>Notifikasi WhatsApp otomatis</li>
                <li>Manajemen barber & layanan</li>
                <li>Dashboard analitik</li>
                <li>Tampilan TV monitor</li>
              </ul>
              <p>Pembayaran diproses melalui <strong className="text-white">Pakasir</strong> (QRIS / Virtual Account). Langganan berlaku 30 hari sejak pembayaran dikonfirmasi. Cancel kapan saja — akses tetap aktif sampai periode berakhir.</p>
              <p>Kami tidak menawarkan refund setelah pembayaran berhasil. Jika ada masalah teknis dari pihak kami, kami akan memperpanjang masa langganan Anda.</p>
            </div>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-white mb-4">5. Penggunaan yang Diizinkan</h2>
            <p className="text-dark-300 leading-relaxed mb-3">Layanan hanya boleh digunakan untuk:</p>
            <ul className="list-disc list-inside space-y-2 text-dark-300 leading-relaxed">
              <li>Manajemen antrian barbershop atau usaha perawatan rambut yang sah</li>
              <li>Tujuan bisnis yang legal berdasarkan hukum Indonesia</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-white mb-4">6. Larangan</h2>
            <ul className="list-disc list-inside space-y-2 text-dark-300 leading-relaxed">
              <li>Menyalahgunakan layanan untuk aktivitas ilegal atau penipuan</li>
              <li>Mencoba meretas, reverse-engineering, atau mengganggu infrastruktur kami</li>
              <li>Menggunakan bot untuk mengisi antrian secara massal</li>
              <li>Mendaftarkan akun palsu atau identitas fiktif</li>
              <li>Menjual kembali akses layanan kepada pihak lain</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-white mb-4">7. Ketersediaan Layanan</h2>
            <p className="text-dark-300 leading-relaxed">
              Kami berupaya menjaga uptime 99%+, namun tidak menjamin layanan bebas gangguan sepenuhnya. Pemeliharaan terjadwal akan diberitahukan terlebih dahulu. Kami tidak bertanggung jawab atas kerugian akibat downtime di luar kendali kami.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-white mb-4">8. Penangguhan & Penghentian Akun</h2>
            <p className="text-dark-300 leading-relaxed">
              Kami berhak menangguhkan atau menghapus akun yang melanggar syarat ini tanpa pemberitahuan sebelumnya. Untuk pelanggaran ringan, kami akan mengirimkan peringatan terlebih dahulu. Anda dapat menghapus akun kapan saja melalui dashboard atau dengan menghubungi kami.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-white mb-4">9. Batasan Tanggung Jawab</h2>
            <p className="text-dark-300 leading-relaxed">
              Layanan disediakan &ldquo;sebagaimana adanya&rdquo;. Kami tidak bertanggung jawab atas kerugian tidak langsung, kehilangan pendapatan, atau kerugian data akibat penggunaan atau ketidakmampuan menggunakan layanan. Tanggung jawab maksimal kami dibatasi pada jumlah yang Anda bayarkan dalam 30 hari terakhir.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-white mb-4">10. Hukum yang Berlaku</h2>
            <p className="text-dark-300 leading-relaxed">
              Syarat ini tunduk pada hukum Republik Indonesia. Sengketa diselesaikan secara musyawarah terlebih dahulu, dan jika tidak tercapai kesepakatan, melalui Pengadilan Negeri yang berwenang.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-white mb-4">11. Perubahan Syarat</h2>
            <p className="text-dark-300 leading-relaxed">
              Kami dapat memperbarui syarat ini kapan saja. Perubahan signifikan akan diberitahukan via email 7 hari sebelum berlaku. Penggunaan layanan setelah tanggal efektif berarti Anda menerima perubahan tersebut.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-white mb-4">12. Kontak</h2>
            <p className="text-dark-300 leading-relaxed">
              Pertanyaan mengenai syarat ini:{" "}
               <a href="mailto:hello@kapster.my.id" className="text-barber-400 hover:text-barber-300">
                hello@kapster.my.id
              </a>
              {" "}atau WhatsApp{" "}
              <a href="https://wa.me/6285239110184" className="text-barber-400 hover:text-barber-300">
                085239110184
              </a>
            </p>
          </section>

        </div>

        <div className="mt-16 pt-8 border-t border-dark-800/50 flex gap-6 text-sm">
          <Link href="/privacy-policy" className="text-dark-400 hover:text-barber-400 transition-colors">Kebijakan Privasi</Link>
          <Link href="/cookie-policy" className="text-dark-400 hover:text-barber-400 transition-colors">Kebijakan Cookie</Link>
          <Link href="/" className="text-dark-400 hover:text-barber-400 transition-colors">Beranda</Link>
        </div>
      </main>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import Logo from "@/components/Logo";

export const metadata: Metadata = {
  title: "Kebijakan Privasi",
  description: "Kebijakan Privasi Kapster — bagaimana kami mengumpulkan, menggunakan, dan melindungi data Anda.",
};

export default function PrivacyPolicyPage() {
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
        <h1 className="font-display text-3xl font-bold text-white mb-2">Kebijakan Privasi</h1>
        <p className="text-dark-400 text-sm mb-12">Terakhir diperbarui: 15 Mei 2026</p>

        <div className="prose prose-invert prose-sm max-w-none space-y-10">

          <section>
            <h2 className="font-display text-xl font-semibold text-white mb-4">1. Pendahuluan</h2>
            <p className="text-dark-300 leading-relaxed">
               Kapster (&ldquo;kami&rdquo;, &ldquo;layanan&rdquo;) berkomitmen melindungi privasi pengguna. Kebijakan ini menjelaskan data apa yang kami kumpulkan, bagaimana kami menggunakannya, dan hak Anda atas data tersebut.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-white mb-4">2. Data yang Kami Kumpulkan</h2>
            <div className="space-y-4 text-dark-300 leading-relaxed">
              <div>
                <p className="font-medium text-white mb-1">Data Akun Pemilik Barbershop</p>
                <p>Nama lengkap, alamat email, dan password (dienkripsi) saat Anda mendaftar.</p>
              </div>
              <div>
                <p className="font-medium text-white mb-1">Data Bisnis</p>
                <p>Nama barbershop, alamat, nomor telepon, daftar barber, dan layanan yang Anda daftarkan di platform kami.</p>
              </div>
              <div>
                <p className="font-medium text-white mb-1">Data Pelanggan Antrian</p>
                <p>Nama dan nomor telepon pelanggan yang mengambil nomor antrian di barbershop Anda. Data ini dikumpulkan atas nama Anda (barbershop) dan hanya digunakan untuk kebutuhan operasional antrian.</p>
              </div>
              <div>
                <p className="font-medium text-white mb-1">Data Pembayaran</p>
                <p>Kami menyimpan status transaksi dan ID pesanan. Informasi kartu kredit atau rekening bank tidak melewati server kami — diproses langsung oleh Pakasir.</p>
              </div>
              <div>
                <p className="font-medium text-white mb-1">Data Teknis</p>
                <p>Log akses dan metadata sesi untuk keperluan keamanan dan debugging.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-white mb-4">3. Penggunaan Data</h2>
            <ul className="list-disc list-inside space-y-2 text-dark-300 leading-relaxed">
              <li>Menyediakan dan menjalankan layanan manajemen antrian</li>
              <li>Memproses pembayaran langganan</li>
              <li>Mengirimkan notifikasi yang berkaitan dengan layanan</li>
              <li>Meningkatkan fitur dan performa platform</li>
              <li>Memenuhi kewajiban hukum yang berlaku di Indonesia</li>
            </ul>
            <p className="text-dark-300 leading-relaxed mt-4">
              Kami <strong className="text-white">tidak menjual</strong> data Anda kepada pihak ketiga untuk keperluan pemasaran.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-white mb-4">4. Penyimpanan Data</h2>
            <p className="text-dark-300 leading-relaxed">
              Data disimpan di infrastruktur <strong className="text-white">Supabase</strong> dengan enkripsi at-rest dan in-transit (TLS). Server berlokasi di Asia Tenggara. Kami menerapkan kebijakan akses minimum — hanya sistem dan personel yang membutuhkan yang dapat mengakses data Anda.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-white mb-4">5. Berbagi Data dengan Pihak Ketiga</h2>
            <p className="text-dark-300 leading-relaxed mb-3">Kami hanya berbagi data dengan:</p>
            <ul className="list-disc list-inside space-y-2 text-dark-300 leading-relaxed">
              <li><strong className="text-white">Supabase</strong> — penyedia database dan autentikasi</li>
              <li><strong className="text-white">Pakasir</strong> — pemrosesan pembayaran langganan</li>
              <li>Otoritas hukum jika diwajibkan oleh peraturan perundang-undangan Indonesia</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-white mb-4">6. Hak Anda</h2>
            <ul className="list-disc list-inside space-y-2 text-dark-300 leading-relaxed">
              <li><strong className="text-white">Akses</strong> — meminta salinan data yang kami simpan tentang Anda</li>
              <li><strong className="text-white">Koreksi</strong> — memperbarui data yang tidak akurat melalui dashboard</li>
              <li><strong className="text-white">Hapus</strong> — meminta penghapusan akun dan data terkait</li>
              <li><strong className="text-white">Portabilitas</strong> — mengekspor data antrian Anda dalam format CSV</li>
            </ul>
            <p className="text-dark-300 leading-relaxed mt-4">
              Untuk mengajukan permintaan, hubungi kami di{" "}
               <a href="mailto:hi@kapster.my.id" className="text-barber-400 hover:text-barber-300">
                hi@kapster.my.id
              </a>
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-white mb-4">7. Keamanan</h2>
            <p className="text-dark-300 leading-relaxed">
              Kami menerapkan enkripsi TLS untuk semua komunikasi data, hashing password industry-standard, dan monitoring keamanan aktif. Meski demikian, tidak ada sistem yang 100% aman — segera laporkan insiden keamanan ke kami.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-white mb-4">8. Perubahan Kebijakan</h2>
            <p className="text-dark-300 leading-relaxed">
              Perubahan signifikan akan diberitahukan via email minimal 7 hari sebelum berlaku. Penggunaan layanan setelah tanggal efektif berarti Anda menyetujui kebijakan yang diperbarui.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-white mb-4">9. Kontak</h2>
            <p className="text-dark-300 leading-relaxed">
              Pertanyaan mengenai privasi:{" "}
               <a href="mailto:hi@kapster.my.id" className="text-barber-400 hover:text-barber-300">
                hi@kapster.my.id
              </a>
              {" "}atau WhatsApp{" "}
              <a href="https://wa.me/6285239110184" className="text-barber-400 hover:text-barber-300">
                085239110184
              </a>
            </p>
          </section>

        </div>

        <div className="mt-16 pt-8 border-t border-dark-800/50 flex gap-6 text-sm">
          <Link href="/terms-of-service" className="text-dark-400 hover:text-barber-400 transition-colors">Syarat & Ketentuan</Link>
          <Link href="/cookie-policy" className="text-dark-400 hover:text-barber-400 transition-colors">Kebijakan Cookie</Link>
          <Link href="/" className="text-dark-400 hover:text-barber-400 transition-colors">Beranda</Link>
        </div>
      </main>
    </div>
  );
}

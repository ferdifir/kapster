import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Tentang Kapster — Sistem Antrian Barbershop",
  description: "Kapster adalah sistem manajemen antrian digital untuk barbershop di Indonesia. Dibuat untuk membantu barbershop mengelola antrian lebih efisien. Rp10.000/bulan.",
};

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main id="main-content" className="pt-28 pb-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="font-display text-3xl sm:text-4xl font-bold mb-8">
            Tentang <span className="text-gold-gradient">Kapster</span>
          </h1>

          <div className="prose prose-invert max-w-none">
            <p className="text-dark-300 text-lg leading-relaxed mb-6">
              Kapster adalah sistem manajemen antrian digital yang dirancang khusus untuk barbershop di Indonesia. 
              Platform ini membantu barbershop mengelola antrian secara real-time, menerima booking online, 
              dan mengirim notifikasi otomatis kepada pelanggan.
            </p>

            <h2 className="font-display text-2xl font-semibold text-white mt-12 mb-4">Misi Kami</h2>
            <p className="text-dark-300 leading-relaxed mb-6">
              Kami percaya bahwa setiap barbershop berhak memiliki sistem antrian yang modern dan efisien. 
              Itulah mengapa Kapster hadir dengan harga terjangkau Rp10.000/bulan — bayar sekali, pakai 30 hari penuh.
            </p>

            <h2 className="font-display text-2xl font-semibold text-white mt-12 mb-4">Fitur Utama</h2>
            <ul className="text-dark-300 space-y-2 mb-6">
              <li>Antrian digital real-time yang bisa diakses pelanggan dari HP</li>
              <li>Booking online dengan pilihan barber dan layanan</li>
              <li>Notifikasi WhatsApp otomatis saat giliran hampir tiba</li>
              <li>Dashboard untuk memantau performa dan pendapatan</li>
              <li>TV display untuk menampilkan nomor antrian di barbershop</li>
            </ul>

            <h2 className="font-display text-2xl font-semibold text-white mt-12 mb-4">Hubungi Kami</h2>
            <p className="text-dark-300 leading-relaxed mb-6">
              Ada pertanyaan atau saran? Hubungi kami melalui{" "}
              <a href="https://wa.me/6285239110184" className="text-barber-400 hover:underline">
                WhatsApp
              </a>{" "}
              atau kirim email ke{" "}
              <a href="mailto:hello@kapster.my.id" className="text-barber-400 hover:underline">
                hello@kapster.my.id
              </a>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

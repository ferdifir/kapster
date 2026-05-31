"use client";

import { useState } from "react";

const faqs = [
  {
    question: "Apakah Kapster bisa digunakan untuk salon pria skala kecil?",
    answer:
      "Tentu. Kapster dirancang untuk semua skala — dari barbershop satu kursi hingga jaringan besar. Cukup daftar, atur layanan, dan mulai menerima antrian dalam hitungan menit.",
  },
  {
    question: "Apakah pelanggan perlu instal aplikasi?",
    answer:
      "Tidak perlu. Pelanggan cukup scan QR code atau buka link dari WhatsApp untuk melihat antrian, booking, atau ambil nomor. Semua via browser.",
  },
  {
    question: "Bagaimana cara kerja notifikasi WhatsApp?",
    answer:
      "Saat giliran pelanggan semakin dekat, Kapster otomatis mengirim notifikasi WhatsApp ke nomor yang didaftarkan. Pelanggan bisa datang pas waktunya tanpa perlu menunggu lama.",
  },
  {
    question: "Apakah ada biaya tambahan untuk fitur tertentu?",
    answer:
      "Tidak. Semua fitur — antrian digital, booking online, notifikasi WhatsApp, dashboard laporan, customer display — sudah termasuk dalam satu harga Rp10.000/bulan. Tidak ada biaya tersembunyi.",
  },
  {
    question: "Bisakah saya mencoba Kapster sebelum berlangganan?",
    answer:
      "Ya. Daftar sekarang dan nikmati masa percobaan untuk menjelajahi semua fitur. Tidak perlu komitmen di awal.",
  },
  {
    question: "Apakah data saya aman?",
    answer:
      "Keamanan adalah prioritas kami. Data pelanggan dan bisnis Anda disimpan secara terenkripsi di server yang aman. Kami tidak akan pernah membagikan data Anda ke pihak ketiga tanpa izin.",
  },
  {
    question: "Berapa lama proses setup-nya?",
    answer:
      "Kurang dari 5 menit. Daftar, buat daftar layanan, atur jam operasional — dan siap digunakan. Tim kami juga siap membantu jika ada kendala.",
  },
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-24 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-dark-950 via-dark-900/50 to-dark-950" />
      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-barber-400/10 text-barber-400 text-sm font-semibold mb-4">
            Tanya Jawab
          </span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
            Pertanyaan yang
            <span className="text-gold-gradient"> Sering Diajukan</span>
          </h2>
          <p className="text-dark-300 text-lg max-w-2xl mx-auto">
            Masih ragu? Temukan jawaban untuk pertanyaan yang paling sering ditanyakan.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={index}
                className="rounded-2xl bg-dark-800/50 border border-dark-700/30 overflow-hidden transition-colors duration-200"
              >
                <button
                  type="button"
                  onClick={() => toggle(index)}
                  className="w-full flex items-center justify-between px-6 py-5 text-left"
                >
                  <span className="text-white font-semibold text-base pr-4">
                    {faq.question}
                  </span>
                  <svg
                    className={`w-5 h-5 text-barber-400 shrink-0 transition-transform duration-200 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div
                  className={`transition-all duration-200 overflow-hidden ${
                    isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                  }`}
                >
                  <div className="px-6 pb-5 text-dark-400 leading-relaxed text-sm">
                    {faq.answer}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

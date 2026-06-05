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
      "Kapster berbayar Rp10.000 per bulan dan belum menyediakan masa percobaan. Namun dengan harga tersebut, semua fitur sudah bisa langsung digunakan tanpa biaya tambahan.",
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
    <section id="faq" className="relative overflow-hidden bg-[#070706] py-20 sm:py-24">
      <div className="relative mx-auto max-w-3xl px-5 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex rounded-full border border-barber-300/20 bg-barber-300/10 px-3 py-1.5 text-xs font-semibold text-barber-200">
            Tanya Jawab
          </div>
          <h2 className="mt-5 font-display text-3xl font-bold tracking-tight text-white sm:text-5xl">
            Pertanyaan yang <span className="text-barber-300">Sering Diajukan</span>
          </h2>
          <p className="mt-5 text-sm leading-7 text-dark-400 sm:text-base">
            Masih ragu? Temukan jawaban untuk pertanyaan yang paling sering ditanyakan.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={index}
                className="rounded-2xl border border-white/10 bg-white/[0.035] overflow-hidden transition-colors duration-200"
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
                    className={`w-5 h-5 text-barber-300 shrink-0 transition-transform duration-200 ${
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

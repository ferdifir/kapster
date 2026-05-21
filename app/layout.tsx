import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const siteUrl = "https://kapster.my.id";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Kapster — Sistem Antrian Barbershop #1 di Indonesia",
    template: "%s | Kapster",
  },
  description:
    "Sistem antrian digital gratis untuk barbershop. Kelola antrian real-time, booking online, dan notifikasi WhatsApp.",
  keywords: [
    "sistem antrian barbershop",
    "antrian digital barbershop",
    "manajemen antrian barbershop",
    "software barbershop",
    "aplikasi barbershop",
    "booking barbershop online",
    "notifikasi whatsapp barbershop",
    "dashboard barbershop",
    "Kapster",
    "antrian online barbershop",
    "sistem antrian digital",
    "manajemen barbershop",
  ],
  authors: [{ name: "Kapster", url: siteUrl }],
  creator: "Kapster",
  publisher: "Kapster",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: siteUrl,
    siteName: "Kapster",
    title: "Kapster — Sistem Antrian Barbershop #1 di Indonesia",
    description:
      "Kelola antrian barbershop makin gacor! Antrian real-time, booking online, notifikasi WhatsApp. 100% gratis.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Kapster — Sistem Antrian Barbershop #1 di Indonesia",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Kapster — Sistem Antrian Barbershop #1 di Indonesia",
    description:
      "Kelola antrian barbershop makin gacor! Antrian real-time, booking online, notifikasi WhatsApp. 500+ barbershop sudah pakai.",
    images: ["/og-image.png"],
    creator: "@kapster",
    site: "@kapster",
  },
  alternates: {
    canonical: siteUrl,
  },
  category: "technology",
  manifest: "/site.webmanifest",
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    shortcut: "/icon.svg",
  },
  verification: {
    google: "your-google-verification-code",
  },
};

const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Kapster",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url: siteUrl,
    description:
      "Sistem manajemen antrian digital #1 untuk barbershop di Indonesia. Kelola antrian real-time, booking online, notifikasi WhatsApp.",
    offers: {
      "@type": "Offer",
      "@id": `${siteUrl}#/offers/free`,
      name: "Gratis",
      price: "0",
      priceCurrency: "IDR",
      description: "Semua fitur gratis untuk barbershop",
    },
    author: {
      "@type": "Organization",
      name: "Kapster",
      url: siteUrl,
    },
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Apa itu Kapster?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Kapster adalah sistem manajemen antrian digital untuk barbershop di Indonesia. Pelanggan bisa cek antrian real-time dan booking online tanpa perlu datang langsung.",
        },
      },
      {
        "@type": "Question",
        name: "Apakah Kapster gratis?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Ya, Kapster 100% gratis. Semua fitur tersedia tanpa biaya bulanan dan tanpa batasan tersembunyi.",
        },
      },
      {
        "@type": "Question",
        name: "Bagaimana cara menggunakan Kapster?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Cukup pilih barbershop tujuan, ambil nomor antrian secara online, lalu datang sesuai giliran. Anda bisa pantau antrian real-time dari HP.",
        },
      },
      {
        "@type": "Question",
        name: "Apakah Kapster mendukung notifikasi WhatsApp?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Ya, Kapster terintegrasi dengan WhatsApp untuk mengirim notifikasi otomatis saat giliran Anda hampir tiba.",
        },
      },
    ],
  },
  {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "Cara Menggunakan Kapster",
    description: "Ambil antrian barbershop online dalam 3 langkah mudah",
    step: [
      {
        "@type": "HowToStep",
        position: 1,
        name: "Pilih Barbershop",
        text: "Cari barbershop tujuan Anda di Kapster melalui link, QR code, atau peta barbershop terdekat.",
      },
      {
        "@type": "HowToStep",
        position: 2,
        name: "Ambil Nomor Antrian",
        text: "Masukkan nama dan nomor telepon, lalu pilih layanan yang diinginkan. Anda akan mendapat nomor antrian secara instan.",
      },
      {
        "@type": "HowToStep",
        position: 3,
        name: "Datang Sesuai Giliran",
        text: "Pantau posisi antrian secara real-time dari HP. Datang ke barbershop saat giliran Anda hampir tiba.",
      },
    ],
  },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${playfair.variable} ${inter.variable} scroll-smooth`}
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <meta name="theme-color" content="#0a0a0a" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="font-body antialiased">{children}</body>
    </html>
  );
}

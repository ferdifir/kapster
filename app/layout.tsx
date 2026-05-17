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
    "Sistem manajemen antrian digital #1 untuk barbershop di Indonesia. Kelola antrian real-time, booking online, notifikasi WhatsApp, dan laporan bisnis dalam satu platform. Coba gratis 14 hari.",
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
      "Kelola antrian barbershop makin gacor! Antrian real-time, booking online, notifikasi WhatsApp, dan laporan bisnis. 500+ barbershop sudah pakai. Coba gratis 14 hari.",
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

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Kapster",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  url: siteUrl,
  description:
    "Sistem manajemen antrian digital #1 untuk barbershop di Indonesia. Kelola antrian real-time, booking online, notifikasi WhatsApp.",
  offers: [
    {
      "@type": "Offer",
      name: "Starter",
      price: "0",
      priceCurrency: "IDR",
      description: "Cocok untuk barbershop yang baru mulai",
    },
    {
      "@type": "Offer",
      name: "Professional",
      price: "99000",
      priceCurrency: "IDR",
      description: "Untuk barbershop yang sudah berjalan serius",
    },
    {
      "@type": "Offer",
      name: "Enterprise",
      price: "249000",
      priceCurrency: "IDR",
      description: "Untuk chain barbershop dengan banyak cabang",
    },
  ],
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.9",
    reviewCount: "500",
    bestRating: "5",
    worstRating: "1",
  },
  author: {
    "@type": "Organization",
    name: "Kapster",
    url: siteUrl,
  },
};

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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="font-body antialiased">{children}</body>
    </html>
  );
}

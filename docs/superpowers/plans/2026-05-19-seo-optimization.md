# SEO Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Optimize Kapster for search engine discoverability — dynamic metadata per barbershop, structured data, sitemap, and Core Web Vitals improvements.

**Architecture:** Three-phase approach: (1) Dynamic metadata + selective indexing, (2) Sitemap + JSON-LD structured data, (3) Performance optimizations (preconnect, content-visibility, next/image).

**Tech Stack:** Next.js 16.2.6 App Router, React 19, TypeScript, Supabase, Tailwind CSS v4.

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `app/booking/[slug]/page.tsx` | Modify | Add `generateMetadata()` with dynamic title, description, canonical, robots |
| `app/q/[slug]/page.tsx` | Modify | Add `generateMetadata()`, JSON-LD injection, replace `<img>` with `<Image>` |
| `app/display/[slug]/page.tsx` | Modify | Add `noindex` metadata, replace `<img>` with `<Image>` |
| `app/sitemap.ts` | Replace | Dynamic sitemap with barbershop pages |
| `app/layout.tsx` | Modify | Add preconnect, theme-color, FAQ+HowTo JSON-LD, fix aggregateRating |
| `app/page.tsx` | Modify | Wrap below-fold sections with `contentVisibility: auto` |
| `next.config.ts` | Modify | Add `images.remotePatterns` for external logo URLs |

---

### Task 1: Configure next/image remote patterns

**Files:**
- Modify: `next.config.ts`

- [ ] **Step 1: Add image remote patterns to next.config.ts**

Read `next.config.ts` and replace its content:

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
```

This allows `next/image` to optimize logos stored in Supabase storage.

- [ ] **Step 2: Commit**

```bash
git add next.config.ts
git commit -m "chore: add next/image remote patterns for Supabase storage"
```

---

### Task 2: Dynamic metadata for booking/[slug]

**Files:**
- Modify: `app/booking/[slug]/page.tsx`

- [ ] **Step 1: Add generateMetadata and update query**

Replace the entire file content:

```tsx
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import type { Metadata, ResolvingMetadata } from "next";
import Link from "next/link";
import BookingForm from "./BookingForm";

const siteUrl = "https://kapster.my.id";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: barbershop } = await supabase
    .from("barbershops")
    .select("id, name, slug, address, city, settings_json")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (!barbershop) return { title: "Not Found" };

  const settings = (barbershop.settings_json as Record<string, unknown>) ?? {};
  const showInDirectory = settings.show_in_directory !== false;

  return {
    title: `Booking Online - ${barbershop.name}`,
    description: `Reservasi antrian di ${barbershop.name}, ${barbershop.city ?? "Indonesia"}. Pilih barber, layanan, dan jadwal tanpa perlu datang langsung.`,
    alternates: {
      canonical: `${siteUrl}/booking/${slug}`,
    },
    robots: {
      index: showInDirectory,
      follow: showInDirectory,
    },
    openGraph: {
      title: `Booking Online - ${barbershop.name} | Kapster`,
      description: `Reservasi antrian di ${barbershop.name}. Pilih barber, layanan, dan jadwal tanpa perlu datang langsung.`,
      url: `${siteUrl}/booking/${slug}`,
      siteName: "Kapster",
      locale: "id_ID",
      type: "website",
    },
  };
}

export default async function BookingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: barbershop } = await supabase
    .from("barbershops")
    .select("id, name, slug, address, city")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (!barbershop) notFound();

  const [{ data: barbers }, { data: services }] = await Promise.all([
    supabase
      .from("barbers")
      .select("id, display_name")
      .eq("barbershop_id", barbershop.id)
      .eq("is_active", true),
    supabase
      .from("services")
      .select("id, name, price, duration_min")
      .eq("barbershop_id", barbershop.id)
      .eq("is_active", true),
  ]);

  return (
    <div className="min-h-screen bg-dark-950">
      <div className="bg-dark-900/80 border-b border-dark-800/50 px-4 py-4 text-center">
        <span className="font-display text-sm font-bold text-white">
          Kapster
        </span>
      </div>

      <div className="max-w-md mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="font-display text-xl font-bold text-white">{barbershop.name}</h1>
          {(barbershop.address || barbershop.city) && (
            <p className="text-dark-400 text-sm mt-0.5">
              {[barbershop.address, barbershop.city].filter(Boolean).join(", ")}
            </p>
          )}
          <p className="text-dark-500 text-xs mt-1">Reservasi jadwal kunjungan</p>
        </div>

        <BookingForm
          barbershopId={barbershop.id}
          slug={slug}
          barbers={barbers ?? []}
          services={services ?? []}
        />

        <div className="text-center">
          <Link
            href={`/q/${slug}`}
            className="text-dark-500 text-sm hover:text-dark-300 transition-colors"
          >
            Atau daftar antrian walk-in →
          </Link>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Build to verify**

```bash
npm run build 2>&1 | tail -20
```
Expected: Build succeeds without errors.

- [ ] **Step 3: Commit**

```bash
git add app/booking/\[slug\]/page.tsx
git commit -m "feat(seo): add dynamic metadata to booking page"
```

---

### Task 3: Dynamic metadata for q/[slug]

**Files:**
- Modify: `app/q/[slug]/page.tsx`

- [ ] **Step 1: Add generateMetadata**

Add these imports at the top of the file (after existing imports):

```tsx
import type { Metadata, ResolvingMetadata } from "next";
```

Add this function before the `PublicQueuePage` component:

```tsx
const siteUrl = "https://kapster.my.id";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ date?: string }>;
};

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: barbershop } = await supabase
    .from("barbershops")
    .select("id, name, slug, city, address, settings_json, logo_url")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (!barbershop) return { title: "Not Found" };

  const settings = (barbershop.settings_json as Record<string, unknown>) ?? {};
  const showInDirectory = settings.show_in_directory !== false;

  return {
    title: `Antrian Real-time - ${barbershop.name}`,
    description: `Cek antrian ${barbershop.name} secara real-time. Lihat berapa orang yang mengantri dan ambil nomor antrian online.`,
    alternates: {
      canonical: `${siteUrl}/q/${slug}`,
    },
    robots: {
      index: showInDirectory,
      follow: showInDirectory,
    },
    openGraph: {
      title: `Antrian Real-time - ${barbershop.name} | Kapster`,
      description: `Cek antrian ${barbershop.name} secara real-time. Lihat berapa orang yang mengantri dan ambil nomor antrian online.`,
      url: `${siteUrl}/q/${slug}`,
      siteName: "Kapster",
      locale: "id_ID",
      type: "website",
      images: barbershop.logo_url
        ? [{ url: barbershop.logo_url, width: 400, height: 400, alt: `Logo ${barbershop.name}` }]
        : undefined,
    },
  };
}
```

- [ ] **Step 2: Build to verify**

```bash
npm run build 2>&1 | tail -20
```
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add app/q/\[slug\]/page.tsx
git commit -m "feat(seo): add dynamic metadata to queue page"
```

---

### Task 4: noindex for display/[slug]

**Files:**
- Modify: `app/display/[slug]/page.tsx`

- [ ] **Step 1: Add metadata export**

Add at the top of `app/display/[slug]/page.tsx` (after the `"use client"` directive and imports):

```tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};
```

Place it after the imports and before the `DisplayPage` component.

- [ ] **Step 2: Build to verify**

```bash
npm run build 2>&1 | tail -20
```
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add app/display/\[slug\]/page.tsx
git commit -m "feat(seo): add noindex to display page"
```

---

### Task 5: Dynamic sitemap with barbershop pages

**Files:**
- Modify: `app/sitemap.ts`

- [ ] **Step 1: Replace sitemap.ts**

Replace the entire file:

```tsx
import { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

const siteUrl = "https://kapster.my.id";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();

  const { data: barbershops } = await supabase
    .from("barbershops")
    .select("id, slug, settings_json")
    .eq("is_active", true);

  const barbershopEntries: MetadataRoute.Sitemap = [];

  if (barbershops) {
    for (const bs of barbershops) {
      const settings = (bs.settings_json as Record<string, unknown>) ?? {};
      if (settings.show_in_directory === false) continue;

      const slug = bs.slug as string;
      barbershopEntries.push({
        url: `${siteUrl}/q/${slug}`,
        lastModified: new Date(),
        changeFrequency: "daily",
        priority: 0.7,
      });
      barbershopEntries.push({
        url: `${siteUrl}/booking/${slug}`,
        lastModified: new Date(),
        changeFrequency: "daily",
        priority: 0.7,
      });
    }
  }

  return [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${siteUrl}/privacy-policy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${siteUrl}/terms-of-service`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${siteUrl}/cookie-policy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    ...barbershopEntries,
  ];
}
```

- [ ] **Step 2: Build to verify**

```bash
npm run build 2>&1 | tail -20
```
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add app/sitemap.ts
git commit -m "feat(seo): dynamic sitemap with barbershop pages"
```

---

### Task 6: Homepage JSON-LD (FAQ + HowTo + fix aggregateRating)

**Files:**
- Modify: `app/layout.tsx`

- [ ] **Step 1: Update JSON-LD in layout.tsx**

Replace the `jsonLd` constant (lines 97-141) with:

```tsx
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
        name: "Basic",
        price: "29000",
        priceCurrency: "IDR",
        description: "Untuk barbershop kecil yang serius",
      },
      {
        "@type": "Offer",
        name: "Pro",
        price: "79000",
        priceCurrency: "IDR",
        description: "Untuk barbershop yang butuh analytics lengkap",
      },
    ],
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
          text: "Ya, Kapster menyediakan paket Starter gratis untuk 1 barber dengan batas 30 antrian per hari. Paket berbayar mulai dari Rp29.000/bulan.",
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
```

- [ ] **Step 2: Update the script tag to render array**

Replace the `<script>` tag in the `<head>` section (lines 154-157):

```tsx
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
```

This stays the same — `JSON.stringify` handles arrays correctly.

- [ ] **Step 3: Add preconnect and theme-color to <head>**

Replace the `<head>` section (lines 153-158) with:

```tsx
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <meta name="theme-color" content="#0a0a0a" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
```

- [ ] **Step 4: Build to verify**

```bash
npm run build 2>&1 | tail -20
```
Expected: Build succeeds.

- [ ] **Step 5: Commit**

```bash
git add app/layout.tsx
git commit -m "feat(seo): add FAQ+HowTo JSON-LD, remove aggregateRating, add preconnect"
```

---

### Task 7: Per-barbershop JSON-LD (LocalBusiness)

**Files:**
- Modify: `app/q/[slug]/page.tsx`
- Modify: `app/booking/[slug]/page.tsx`

- [ ] **Step 1: Add LocalBusiness JSON-LD to q/[slug]/page.tsx**

In the `PublicQueuePage` component, add the JSON-LD script. After the `isOpen` variable declaration (around line 68), add:

```tsx
  const localBusinessJsonLd = {
    "@context": "https://schema.org",
    "@type": "HairSalon",
    name: barbershop.name,
    url: `${siteUrl}/booking/${slug}`,
    image: barbershop.logo_url || undefined,
    address: {
      "@type": "PostalAddress",
      streetAddress: barbershop.address || undefined,
      addressLocality: barbershop.city || undefined,
      addressCountry: "ID",
    },
    geo: barbershop.latitude && barbershop.longitude
      ? {
          "@type": "GeoCoordinates",
          latitude: barbershop.latitude,
          longitude: barbershop.longitude,
        }
      : undefined,
    priceRange: services && services.length > 0
      ? `Rp${Math.min(...services.map((s) => s.price))} - Rp${Math.max(...services.map((s) => s.price))}`
      : undefined,
  };
```

Note: The `q/[slug]` page already queries `settings_json, logo_url` but NOT `latitude, longitude`. Update the barbershop query (line 18-22) to include them:

```tsx
  const { data: barbershop } = await supabase
    .from("barbershops")
    .select("id, name, city, address, settings_json, logo_url, latitude, longitude")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();
```

In the JSX return, add the script tag inside the `<div className="min-h-screen bg-dark-950">` right after the Kapster header bar:

```tsx
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd) }}
      />
```

- [ ] **Step 2: Add LocalBusiness JSON-LD to booking/[slug]/page.tsx**

Update the barbershop query (line 14-19) to include `latitude, longitude`:

```tsx
  const { data: barbershop } = await supabase
    .from("barbershops")
    .select("id, name, slug, address, city, latitude, longitude")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();
```

After the `services` query (around line 34), add:

```tsx
  const localBusinessJsonLd = {
    "@context": "https://schema.org",
    "@type": "HairSalon",
    name: barbershop.name,
    url: `${siteUrl}/booking/${slug}`,
    address: {
      "@type": "PostalAddress",
      streetAddress: barbershop.address || undefined,
      addressLocality: barbershop.city || undefined,
      addressCountry: "ID",
    },
    geo: barbershop.latitude && barbershop.longitude
      ? {
          "@type": "GeoCoordinates",
          latitude: barbershop.latitude,
          longitude: barbershop.longitude,
        }
      : undefined,
    priceRange: services && services.length > 0
      ? `Rp${Math.min(...services.map((s) => s.price))} - Rp${Math.max(...services.map((s) => s.price))}`
      : undefined,
  };
```

In the JSX return, add the script tag inside the outer `<div>`:

```tsx
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd) }}
      />
```

- [ ] **Step 3: Build to verify**

```bash
npm run build 2>&1 | tail -20
```
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add app/q/\[slug\]/page.tsx app/booking/\[slug\]/page.tsx
git commit -m "feat(seo): add LocalBusiness JSON-LD to barbershop pages"
```

---

### Task 8: Homepage content-visibility for below-fold sections

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Wrap below-fold sections**

Replace the entire `app/page.tsx`:

```tsx
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import BrandLogos from "@/components/BrandLogos";
import ProblemSection from "@/components/ProblemSection";
import FeaturesSection from "@/components/FeaturesSection";
import HowItWorks from "@/components/HowItWorks";
import PricingSection from "@/components/PricingSection";
import Testimonials from "@/components/Testimonials";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";

const cvStyle = { contentVisibility: "auto" } as React.CSSProperties;

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <div style={cvStyle}><BrandLogos /></div>
        <div style={cvStyle}><ProblemSection /></div>
        <div style={cvStyle}><FeaturesSection /></div>
        <div style={cvStyle}><HowItWorks /></div>
        <div style={cvStyle}><PricingSection /></div>
        <div style={cvStyle}><Testimonials /></div>
        <div style={cvStyle}><CTASection /></div>
      </main>
      <Footer />
    </>
  );
}
```

- [ ] **Step 2: Build to verify**

```bash
npm run build 2>&1 | tail -20
```
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add app/page.tsx
git commit -m "perf: add content-visibility to below-fold homepage sections"
```

---

### Task 9: Replace <img> with <Image> for logos

**Files:**
- Modify: `app/q/[slug]/page.tsx`
- Modify: `app/display/[slug]/page.tsx`

- [ ] **Step 1: Update q/[slug]/page.tsx**

Add import at the top:

```tsx
import Image from "next/image";
```

Replace the `<img>` tag for the logo (lines 81-85):

```tsx
            <Image
              src={barbershop.logo_url}
              alt={`Logo ${barbershop.name}`}
              width={80}
              height={80}
              className="rounded-2xl object-cover mx-auto mb-4"
              priority
            />
```

Note: `priority` is used because the logo is above-the-fold on this page.

- [ ] **Step 2: Update display/[slug]/page.tsx**

Add import at the top:

```tsx
import Image from "next/image";
```

Replace the `<img>` tag for the logo (lines 111-115):

```tsx
            <Image
              src={queue.barbershops.logo_url}
              alt="Logo"
              width={40}
              height={40}
              className="rounded-lg object-cover"
              priority
            />
```

- [ ] **Step 3: Build to verify**

```bash
npm run build 2>&1 | tail -20
```
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add app/q/\[slug\]/page.tsx app/display/\[slug\]/page.tsx
git commit -m "perf: replace img with next/image for barbershop logos"
```

---

### Task 10: Final build, deploy, and verify

- [ ] **Step 1: Full build**

```bash
npm run build
```
Expected: Full build succeeds with no errors.

- [ ] **Step 2: Restart PM2**

```bash
pm2 restart kapster
```

- [ ] **Step 3: Verify sitemap**

```bash
curl -s https://kapster.my.id/sitemap.xml | head -30
```
Expected: XML output with homepage, legal pages, and barbershop entries.

- [ ] **Step 4: Final commit (if any remaining changes)**

```bash
git add -A
git status
```

- [ ] **Step 5: Push to remote**

```bash
git push origin main
```

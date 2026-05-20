import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
import { cache } from "react";
import { notFound } from "next/navigation";
import Image from "next/image";
import QueueDatePicker from "./QueueDatePicker";
import ServicesCarousel from "./ServicesCarousel";
import GalleryGrid from "./GalleryGrid";
import QueueForm from "./QueueForm";
import MobileBottomSheet from "./MobileBottomSheet";
import HeroPattern from "./HeroPattern";

const siteUrl = "https://kapster.my.id";

const getBarbershop = cache(async (slug: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("barbershops")
    .select("id, name, slug, city, address, settings_json, logo_url, cover_image_url, about, latitude, longitude")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();
  return data;
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const barbershop = await getBarbershop(slug);

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
      images: barbershop.cover_image_url
        ? [{ url: barbershop.cover_image_url, width: 1200, height: 630, alt: `${barbershop.name}` }]
        : barbershop.logo_url
        ? [{ url: barbershop.logo_url, width: 400, height: 400, alt: `Logo ${barbershop.name}` }]
        : undefined,
    },
  };
}

export default async function PublicQueuePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ date?: string }>;
}) {
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;
  const barbershop = await getBarbershop(slug);

  if (!barbershop) notFound();

  const supabase = await createClient();

  const today = new Date().toISOString().split("T")[0];
  const selectedDate = resolvedSearchParams.date ?? today;

  const settings = (barbershop.settings_json as Record<string, unknown>) ?? {};
  const maxDays = (settings.booking_max_days as number) ?? 7;
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + maxDays);
  const maxDateStr = maxDate.toISOString().split("T")[0];

  const validDate = selectedDate >= today && selectedDate <= maxDateStr
    ? selectedDate
    : today;

  const [{ data: queue }, { data: services }, { data: barbers }] =
    await Promise.all([
      supabase
        .from("queues")
        .select("id, is_open, total_served")
        .eq("barbershop_id", barbershop.id)
        .eq("date", validDate)
        .maybeSingle(),
      supabase
        .from("services")
        .select("id, name, price, duration_min")
        .eq("barbershop_id", barbershop.id)
        .eq("is_active", true),
      supabase
        .from("barbers")
        .select("id, display_name")
        .eq("barbershop_id", barbershop.id)
        .eq("is_active", true),
    ]);

  const { count: waitingCount } =
    queue?.is_open
      ? await supabase
          .from("queue_entries")
          .select("id", { count: "exact", head: true })
          .eq("queue_id", queue.id)
          .in("status", ["waiting", "called", "serving"])
      : { count: 0 };

  const isOpen = !!queue?.is_open;
  const isFutureDate = validDate > today;

  const prices = services?.map((s) => s.price).filter((p): p is number => p != null) ?? [];
  const galleryImages = ((settings.gallery_images as string[]) ?? [])
    .slice(0, 6);

  const aboutText = barbershop.about?.trim() ?? "";
  const isShortAbout = aboutText.length > 0 && aboutText.length <= 100;
  const hasLongAbout = aboutText.length > 100;

  const hasContent = hasLongAbout || (services && services.length > 0) || galleryImages.length > 0;

  const localBusinessJsonLd = {
    "@context": "https://schema.org",
    "@type": "HairSalon",
    name: barbershop.name,
    url: `${siteUrl}/q/${slug}`,
    image: barbershop.cover_image_url || barbershop.logo_url || undefined,
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
    priceRange: prices.length > 0
      ? `Rp${Math.min(...prices)} - Rp${Math.max(...prices)}`
      : undefined,
  };

  const formContent = (
    <>
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-dark-700/50 border border-dark-600/30 p-3 rounded-xl text-center">
          <span className="block text-2xl font-bold text-barber-400">{waitingCount ?? 0}</span>
          <span className="text-[10px] text-dark-500 uppercase tracking-wider font-semibold">Sedang Menunggu</span>
        </div>
        <div className="bg-dark-700/50 border border-dark-600/30 p-3 rounded-xl text-center">
          <span className="block text-2xl font-bold text-dark-400">{queue?.total_served ?? 0}</span>
          <span className="text-[10px] text-dark-500 uppercase tracking-wider font-semibold">Selesai</span>
        </div>
      </div>

      <QueueDatePicker today={today} maxDate={maxDateStr} value={validDate} />

      <QueueForm
        barbershopId={barbershop.id}
        date={validDate}
        slug={slug}
        services={services ?? []}
        barbers={barbers ?? []}
        isOpen={isOpen}
        selectedDate={validDate}
        today={today}
      />
    </>
  );

  return (
    <div className="min-h-screen bg-dark-950 pb-24 lg:pb-0">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd) }}
      />

      {/* Hero Banner */}
      <div className={`relative ${barbershop.cover_image_url ? 'h-64 md:h-80' : 'h-72 md:h-96'} bg-cover bg-center`}>
        {barbershop.cover_image_url ? (
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `linear-gradient(to bottom, rgba(10,10,10,0.3), #0a0a0a), url('${barbershop.cover_image_url}')`,
            }}
          />
        ) : (
          <HeroPattern />
        )}
        
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-6">
          {barbershop.logo_url ? (
            <div className="w-20 h-20 bg-dark-800 rounded-full border-2 border-barber-400 flex items-center justify-center p-2 shadow-xl mb-3">
              <Image
                src={barbershop.logo_url}
                alt={`Logo ${barbershop.name}`}
                width={64}
                height={64}
                className="w-full h-full object-contain rounded-full"
                priority
              />
            </div>
          ) : (
            <div className="w-20 h-20 bg-dark-800 rounded-full border-2 border-barber-400 flex items-center justify-center shadow-xl mb-3">
              <span className="font-display text-3xl font-bold text-barber-400">
                {barbershop.name[0]}
              </span>
            </div>
          )}
          <h1 className="text-2xl md:text-3xl font-display font-bold text-white tracking-wide">{barbershop.name}</h1>
          
          {barbershop.city && (
            <p className="text-sm text-dark-400 flex items-center gap-1 mt-1">
              <svg className="w-4 h-4 text-barber-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              {barbershop.city}
            </p>
          )}

          {/* Short about as tagline */}
          {isShortAbout && (
            <p className="text-dark-300 text-sm mt-2 max-w-md text-center italic">
              &ldquo;{aboutText}&rdquo;
            </p>
          )}

          <span className={`mt-3 px-3 py-1 text-xs font-semibold rounded-full border flex items-center gap-1.5 ${
            isOpen
              ? 'bg-green-500/10 text-green-400 border-green-500/30'
              : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
          }`}>
            <span className={`w-2 h-2 rounded-full ${isOpen ? 'bg-green-400' : 'bg-amber-400 animate-pulse'}`}></span>
            {isOpen ? 'Antrian Dibuka' : 'Booking Dimuka Dibuka'}
          </span>
        </div>
      </div>

      {/* Main Content */}
      <main className={`max-w-6xl mx-auto px-4 ${hasContent ? 'py-8' : 'py-6'} grid grid-cols-1 lg:grid-cols-3 gap-8`}>
        <div className="lg:col-span-2 space-y-8">
          {/* About Section (only for long text) */}
          {hasLongAbout && (
            <section className="bg-dark-900/50 p-6 rounded-2xl border border-dark-800/50">
              <h3 className="text-lg font-semibold text-barber-400 mb-3">Tentang Kami</h3>
              <p className="text-dark-400 text-sm leading-relaxed">{aboutText}</p>
            </section>
          )}

          {/* Services */}
          {services && services.length > 0 && (
            <ServicesCarousel services={services} />
          )}

          {/* Gallery */}
          {galleryImages.length > 0 && (
            <GalleryGrid images={galleryImages} barbershopName={barbershop.name} />
          )}
        </div>

        {/* Desktop Sidebar */}
        <div className="hidden lg:block lg:col-span-1">
          <div className="bg-dark-900/50 border border-dark-800/50 p-6 rounded-2xl sticky top-6 shadow-2xl">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-1">Daftar Antrean</h3>
              {isFutureDate && (
                <p className="text-xs text-amber-400 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  Jam operasional belum dibuka. Anda akan masuk daftar reservasi dimuka.
                </p>
              )}
            </div>
            {formContent}
          </div>
        </div>
      </main>

      {/* Mobile Bottom Sheet */}
      <MobileBottomSheet isFutureDate={isFutureDate}>
        {formContent}
      </MobileBottomSheet>
    </div>
  );
}

import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
import { cache } from "react";
import { notFound } from "next/navigation";
import Image from "next/image";
import JoinQueueForm from "./JoinQueueForm";
import QueueDatePicker from "./QueueDatePicker";

const siteUrl = "https://kapster.my.id";

const getBarbershop = cache(async (slug: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("barbershops")
    .select("id, name, slug, city, address, settings_json, logo_url, latitude, longitude")
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
      images: barbershop.logo_url
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

  if (!barbershop) notFound();

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

  const prices = services?.map((s) => s.price).filter((p): p is number => p != null) ?? [];
  const localBusinessJsonLd = {
    "@context": "https://schema.org",
    "@type": "HairSalon",
    name: barbershop.name,
    url: `${siteUrl}/q/${slug}`,
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
    priceRange: prices.length > 0
      ? `Rp${Math.min(...prices)} - Rp${Math.max(...prices)}`
      : undefined,
  };

  return (
    <div className="min-h-screen bg-dark-950">
      <div className="bg-dark-900/80 border-b border-dark-800/50 px-4 py-4 text-center">
        <span className="font-display text-sm font-bold text-white">
          Kapster
        </span>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd) }}
      />

      <div className="max-w-md mx-auto px-4 py-8 space-y-6">
        <div className="text-center">
          {barbershop.logo_url ? (
            <Image
              src={barbershop.logo_url}
              alt={`Logo ${barbershop.name}`}
              width={80}
              height={80}
              className="rounded-2xl object-cover mx-auto mb-4"
              priority
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl gold-gradient flex items-center justify-center mx-auto mb-4">
              <span className="font-display text-xl font-bold text-dark-900">
                {barbershop.name[0]}
              </span>
            </div>
          )}
          <h1 className="font-display text-2xl font-bold text-white">
            {barbershop.name}
          </h1>
          {barbershop.city && (
            <p className="text-dark-400 text-sm mt-1">{barbershop.city}</p>
          )}
        </div>

        <div className="bg-dark-800/50 border border-dark-700/30 rounded-2xl p-4">
          <label className="block text-dark-400 text-sm mb-2">
            Pilih Tanggal Antrian
          </label>
          <QueueDatePicker today={today} maxDate={maxDateStr} value={validDate} />
          {validDate !== today && (
            <p className="text-barber-400 text-xs mt-2">
              Antrian untuk tanggal{" "}
              {new Date(validDate + "T00:00:00").toLocaleDateString("id-ID", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          )}
        </div>

        {queue && (
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-barber-400/10 border border-barber-400/20 rounded-xl p-4 text-center">
              <p className="font-display text-3xl font-bold text-barber-400">
                {waitingCount ?? 0}
              </p>
              <p className="text-dark-400 text-sm mt-1">Sedang Menunggu</p>
            </div>
            <div className="bg-dark-800/50 border border-dark-700/30 rounded-xl p-4 text-center">
              <p className="font-display text-3xl font-bold text-white">
                {queue?.total_served ?? 0}
              </p>
              <p className="text-dark-400 text-sm mt-1">Selesai</p>
            </div>
          </div>
        )}

        {!isOpen && validDate === today && (
          <div className="bg-dark-800/50 border border-dark-700/30 rounded-2xl p-6 text-center">
            <div className="w-12 h-12 rounded-xl bg-dark-700/50 flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-6 h-6 text-dark-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <p className="text-dark-300 font-semibold">Antrian Hari Ini Belum Dibuka</p>
            <p className="text-dark-500 text-sm mt-1">
              Silakan pilih tanggal lain atau tunggu hingga barbershop buka
            </p>
          </div>
        )}

        <JoinQueueForm
          barbershopId={barbershop.id}
          date={validDate}
          slug={slug}
          services={services ?? []}
          barbers={barbers ?? []}
          isOpen={isOpen}
          selectedDate={validDate}
          today={today}
        />
      </div>
    </div>
  );
}

import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { cache } from "react";
import Link from "next/link";
import BookingForm from "./BookingForm";

const siteUrl = "https://kapster.my.id";

const getBarbershop = cache(async (slug: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("barbershops")
    .select("id, name, slug, address, city, settings_json")
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
  const barbershop = await getBarbershop(slug);

  if (!barbershop) notFound();

  const supabase = await createClient();
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

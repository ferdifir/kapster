import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import BookingForm from "./BookingForm";

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
          Queue<span className="text-barber-400">Barber</span>
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

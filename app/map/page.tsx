import { createClient } from "@/lib/supabase/server";
import MapView from "@/components/MapView";

export default async function PublicMapPage() {
  const supabase = await createClient();

  const { data: barbershops } = await supabase
    .from("barbershops")
    .select("id, name, slug, address, latitude, longitude, logo_url")
    .eq("is_active", true)
    .not("latitude", "is", null)
    .not("longitude", "is", null);

  return (
    <main className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Peta Barbershop</h1>
        <p className="text-dark-400 mb-4">
          Temukan barbershop terdekat di sekitar Anda
        </p>
        <div className="h-[600px] rounded-2xl overflow-hidden border border-dark-700/30">
          <MapView barbershops={barbershops ?? []} />
        </div>
      </div>
    </main>
  );
}

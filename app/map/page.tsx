import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MapViewWrapper from "@/components/MapViewWrapper";

export default async function PublicMapPage() {
  const supabase = await createClient();

  const { data: barbershops } = await supabase
    .from("barbershops")
    .select("id, name, slug, address, latitude, longitude, logo_url")
    .eq("is_active", true)
    .not("latitude", "is", null)
    .not("longitude", "is", null);

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-dark-950 p-4">
        <div className="max-w-4xl mx-auto pt-28">
          <h1 className="text-2xl font-bold mb-4">Peta Barbershop</h1>
          <p className="text-dark-400 mb-4">
            Temukan barbershop terdekat di sekitar Anda
          </p>
          <div className="h-[600px] rounded-2xl overflow-hidden border border-dark-700/30">
            <MapViewWrapper barbershops={barbershops ?? []} />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

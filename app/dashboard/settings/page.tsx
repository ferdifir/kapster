import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import SettingsForm from "@/components/dashboard/SettingsForm";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: barbershop } = await supabase
    .from("barbershops")
    .select("id, name, slug, address, city, phone, wa_number, latitude, longitude, settings_json")
    .eq("owner_id", user.id)
    .single();

  if (!barbershop) redirect("/onboarding");

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-white mb-1">Pengaturan</h1>
        <p className="text-dark-400 text-sm">Profil dan konfigurasi barbershop Anda</p>
      </div>
      <SettingsForm barbershop={barbershop} />
    </div>
  );
}

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
    .select("id, name, slug, address, city, phone, wa_number, latitude, longitude, settings_json, logo_url, cover_image_url, about, wuzapi_user_id, wuzapi_token, wa_connected, wa_phone_number, wa_templates")
    .eq("owner_id", user.id)
    .single();

  if (!barbershop) redirect("/onboarding");

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-white mb-1">Pengaturan</h1>
        <p className="text-dark-400 text-sm">Profil dan konfigurasi barbershop Anda</p>
      </div>
      <SettingsForm barbershop={{ ...barbershop, wa_connected: barbershop.wa_connected ?? false, wa_templates: barbershop.wa_templates as Record<string, string> | null }} />
    </div>
  );
}

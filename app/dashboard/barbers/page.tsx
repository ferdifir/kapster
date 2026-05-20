import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import BarbersManager from "@/components/dashboard/BarbersManager";

export const dynamic = "force-dynamic";

export default async function BarbersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: barbershop } = await supabase
    .from("barbershops")
    .select("id, name, slug")
    .eq("owner_id", user.id)
    .single();

  if (!barbershop) redirect("/onboarding");

  const { data: barbers } = await supabase
    .from("barbers")
    .select("id, display_name, is_active, invite_token, profile_id, created_at")
    .eq("barbershop_id", barbershop.id)
    .order("created_at");

  return (
    <BarbersManager
      barbershop={barbershop}
      barbers={barbers ?? []}
    />
  );
}

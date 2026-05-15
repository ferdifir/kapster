import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ServicesManager from "@/components/dashboard/ServicesManager";

export const dynamic = "force-dynamic";

export default async function ServicesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: barbershop } = await supabase
    .from("barbershops")
    .select("id, name")
    .eq("owner_id", user.id)
    .single();

  if (!barbershop) redirect("/onboarding");

  const { data: services } = await supabase
    .from("services")
    .select("id, name, price, duration_min, is_active, created_at")
    .eq("barbershop_id", barbershop.id)
    .order("created_at");

  return <ServicesManager barbershop={barbershop} services={services ?? []} />;
}

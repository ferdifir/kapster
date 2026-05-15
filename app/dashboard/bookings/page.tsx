import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import BookingsManager from "@/components/dashboard/BookingsManager";

export const dynamic = "force-dynamic";

export default async function BookingsPage() {
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

  const [{ data: bookings }, { data: barbers }, { data: services }] = await Promise.all([
    supabase
      .from("bookings")
      .select("id, customer_name, phone, scheduled_at, status, notes, barber_id, service_id, created_at")
      .eq("barbershop_id", barbershop.id)
      .order("scheduled_at", { ascending: false })
      .limit(100),
    supabase
      .from("barbers")
      .select("id, display_name")
      .eq("barbershop_id", barbershop.id)
      .eq("is_active", true),
    supabase
      .from("services")
      .select("id, name")
      .eq("barbershop_id", barbershop.id)
      .eq("is_active", true),
  ]);

  return (
    <BookingsManager
      bookings={bookings ?? []}
      barbers={barbers ?? []}
      services={services ?? []}
    />
  );
}

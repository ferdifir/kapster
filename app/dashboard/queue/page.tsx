import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import QueueDashboard from "@/components/dashboard/QueueDashboard";

export const dynamic = "force-dynamic";

export default async function QueuePage() {
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

  const today = new Date().toISOString().split("T")[0];

  const [
    { data: queue },
    { data: barbers },
    { data: services },
    { data: subscription },
  ] = await Promise.all([
    supabase
      .from("queues")
      .select("id, is_open, total_served")
      .eq("barbershop_id", barbershop.id)
      .eq("date", today)
      .maybeSingle(),
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
    supabase
      .from("subscriptions")
      .select("max_queue_per_day, max_barbers")
      .eq("barbershop_id", barbershop.id)
      .single(),
  ]);

  const { data: initialEntries } = queue
    ? await supabase
        .from("queue_entries")
        .select(
          "id, number, customer_name, phone, status, barber_id, service_id, joined_at, called_at, serving_at, done_at"
        )
        .eq("queue_id", queue.id)
        .order("number", { ascending: true })
    : { data: [] };

  return (
    <QueueDashboard
      barbershop={barbershop}
      queue={queue ?? null}
      initialEntries={initialEntries ?? []}
      barbers={barbers ?? []}
      services={services ?? []}
      maxPerDay={subscription?.max_queue_per_day ?? 20}
    />
  );
}

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import QueueDashboard from "@/components/dashboard/QueueDashboard";

export const dynamic = "force-dynamic";

export default async function QueuePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: barbershop } = await supabase
    .from("barbershops")
    .select("id, name, slug, settings_json")
    .eq("owner_id", user.id)
    .single();
  if (!barbershop) redirect("/onboarding");

  const today = new Date().toISOString().split("T")[0];
  const selectedDate = resolvedSearchParams.date ?? today;

  const settings = (barbershop.settings_json as Record<string, unknown>) ?? {};
  const maxDays = (settings.booking_max_days as number) ?? 7;
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + maxDays);
  const maxDateStr = maxDate.toISOString().split("T")[0];

  const validDate = selectedDate >= today && selectedDate <= maxDateStr ? selectedDate : today;

  const [{ data: queue }, { data: barbers }, { data: services }, { data: subscription }] =
    await Promise.all([
      supabase
        .from("queues")
        .select("id, is_open, total_served")
        .eq("barbershop_id", barbershop.id)
        .eq("date", validDate)
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

  const isFutureDate = validDate > today;
  const preBookedCount =
    isFutureDate && queue && !queue.is_open
      ? (initialEntries ?? []).length
      : 0;

  return (
    <QueueDashboard
      barbershop={barbershop}
      queue={queue ?? null}
      initialEntries={initialEntries ?? []}
      barbers={barbers ?? []}
      services={services ?? []}
      maxPerDay={subscription?.max_queue_per_day ?? 50}
      selectedDate={validDate}
      today={today}
      maxDate={maxDateStr}
      preBookedCount={preBookedCount}
    />
  );
}

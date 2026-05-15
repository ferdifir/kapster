import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import BarberQueue from "@/components/barber/BarberQueue";

export const dynamic = "force-dynamic";

export default async function BarberPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: barber } = await supabase
    .from("barbers")
    .select("id, display_name, barbershop_id")
    .eq("profile_id", user.id)
    .eq("is_active", true)
    .single();

  if (!barber) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)] px-4">
        <div className="text-center max-w-sm">
          <p className="text-dark-300 font-medium">
            Akun belum terhubung ke barbershop
          </p>
          <p className="text-dark-500 text-sm mt-2">
            Minta pemilik barbershop untuk menghubungkan akun Anda sebagai
            barber.
          </p>
        </div>
      </div>
    );
  }

  const { data: barbershop } = await supabase
    .from("barbershops")
    .select("id, name")
    .eq("id", barber.barbershop_id)
    .single();

  const today = new Date().toISOString().split("T")[0];

  const { data: queue } = await supabase
    .from("queues")
    .select("id, is_open, total_served")
    .eq("barbershop_id", barber.barbershop_id)
    .eq("date", today)
    .maybeSingle();

  const { data: entries } = queue
    ? await supabase
        .from("queue_entries")
        .select(
          "id, number, customer_name, phone, status, barber_id, service_id, joined_at, called_at, serving_at"
        )
        .eq("queue_id", queue.id)
        .order("number", { ascending: true })
    : { data: [] };

  const { data: services } = await supabase
    .from("services")
    .select("id, name")
    .eq("barbershop_id", barber.barbershop_id);

  return (
    <BarberQueue
      barber={barber}
      barbershop={barbershop ?? { id: barber.barbershop_id, name: "" }}
      queue={queue ?? null}
      initialEntries={entries ?? []}
      services={services ?? []}
    />
  );
}

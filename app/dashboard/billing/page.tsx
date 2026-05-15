import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import BillingManager from "./BillingManager";

export const dynamic = "force-dynamic";

export default async function BillingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: barbershop } = await supabase
    .from("barbershops")
    .select("id")
    .eq("owner_id", user.id)
    .single();

  if (!barbershop) redirect("/onboarding");

  const [subResult, paymentsResult, barbersResult] = await Promise.all([
    supabase
      .from("subscriptions")
      .select("plan, status, period_end, max_barbers, max_queue_per_day")
      .eq("barbershop_id", barbershop.id)
      .single(),
    supabase
      .from("payments")
      .select("id, order_id, amount, plan, status, payment_method, created_at, completed_at")
      .eq("barbershop_id", barbershop.id)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("barbers")
      .select("id", { count: "exact", head: true })
      .eq("barbershop_id", barbershop.id)
      .eq("is_active", true),
  ]);

  const subscription = subResult.data ?? {
    plan: "starter" as const,
    status: "trial",
    period_end: null,
    max_barbers: 1,
    max_queue_per_day: 30,
  };

  return (
    <BillingManager
      subscription={subscription}
      payments={paymentsResult.data ?? []}
      barberCount={barbersResult.count ?? 0}
    />
  );
}

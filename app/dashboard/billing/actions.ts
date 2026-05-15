"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const PLAN_AMOUNTS = {
  pro: 149000,
  enterprise: 349000,
} as const;

export async function createPayment(plan: "pro" | "enterprise") {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: barbershop } = await supabase
    .from("barbershops")
    .select("id")
    .eq("owner_id", user.id)
    .single();

  if (!barbershop) return { error: "Barbershop not found" };

  const amount = PLAN_AMOUNTS[plan];
  const orderId = `QB-${barbershop.id.slice(0, 8)}-${plan}-${Date.now()}`;

  const admin = createAdminClient();
  const { error } = await admin.from("payments").insert({
    barbershop_id: barbershop.id,
    order_id: orderId,
    amount,
    plan,
    status: "pending",
  });

  if (error) return { error: "Gagal membuat transaksi" };

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  const redirect = encodeURIComponent(`${baseUrl}/dashboard/billing`);
  const url = `https://app.pakasir.com/pay/queuebarber/${amount}?order_id=${orderId}&redirect=${redirect}`;

  return { url };
}

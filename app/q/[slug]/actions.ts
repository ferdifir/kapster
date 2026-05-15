"use server";

import { createClient } from "@/lib/supabase/server";

export async function joinQueue(
  queueId: string,
  formData: {
    customer_name: string;
    phone?: string;
    service_id?: string;
    barber_id?: string;
  }
) {
  const supabase = await createClient();

  // Enforce daily queue limit from subscription
  const { data: queueRow } = await supabase
    .from("queues")
    .select("barbershop_id")
    .eq("id", queueId)
    .single();

  if (queueRow) {
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("max_queue_per_day")
      .eq("barbershop_id", queueRow.barbershop_id)
      .single();

    if (sub) {
      const { count } = await supabase
        .from("queue_entries")
        .select("id", { count: "exact", head: true })
        .eq("queue_id", queueId);

      if (count !== null && count >= sub.max_queue_per_day) {
        return { error: "Antrian hari ini sudah penuh. Coba lagi besok." };
      }
    }
  }

  const { data: nextNum, error: numError } = await supabase.rpc(
    "next_queue_number",
    { p_queue_id: queueId }
  );

  if (numError) return { error: numError.message };

  const { data, error } = await supabase
    .from("queue_entries")
    .insert({
      queue_id: queueId,
      number: nextNum,
      customer_name: formData.customer_name.trim(),
      phone: formData.phone?.trim() || null,
      service_id: formData.service_id || null,
      barber_id: formData.barber_id || null,
      status: "waiting",
    })
    .select("id, number")
    .single();

  if (error) return { error: error.message };
  return { data };
}

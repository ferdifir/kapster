"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { TablesUpdate } from "@/lib/supabase/types";

export async function openTodayQueue(barbershopId: string) {
  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("queues")
    .upsert(
      { barbershop_id: barbershopId, date: today, is_open: true },
      { onConflict: "barbershop_id,date" }
    )
    .select("id, is_open, total_served")
    .single();

  if (error) return { error: error.message };
  revalidatePath("/dashboard/queue");
  return { data };
}

export async function setQueueOpen(queueId: string, isOpen: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("queues")
    .update({ is_open: isOpen })
    .eq("id", queueId);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/queue");
  return {};
}

export async function addQueueCustomer(
  queueId: string,
  maxPerDay: number,
  formData: {
    customer_name: string;
    phone?: string;
    barber_id?: string;
    service_id?: string;
  }
) {
  const supabase = await createClient();

  const { count } = await supabase
    .from("queue_entries")
    .select("id", { count: "exact", head: true })
    .eq("queue_id", queueId);

  if ((count ?? 0) >= maxPerDay) {
    return { error: `Batas antrian harian (${maxPerDay}) sudah tercapai.` };
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
      barber_id: formData.barber_id || null,
      service_id: formData.service_id || null,
      status: "waiting",
    })
    .select("id, number")
    .single();

  if (error) return { error: error.message };
  revalidatePath("/dashboard/queue");
  return { data };
}

export async function setEntryStatus(
  entryId: string,
  status: "called" | "serving" | "done" | "skip",
  queueId?: string
) {
  const supabase = await createClient();

  const now = new Date().toISOString();
  const updates: TablesUpdate<"queue_entries"> = { status };
  if (status === "called") updates.called_at = now;
  if (status === "serving") updates.serving_at = now;
  if (status === "done" || status === "skip") updates.done_at = now;

  const { error } = await supabase
    .from("queue_entries")
    .update(updates)
    .eq("id", entryId);

  if (error) return { error: error.message };

  if (status === "done" && queueId) {
    await supabase.rpc("increment_queue_served", { p_queue_id: queueId });
  }

  revalidatePath("/dashboard/queue");
  return {};
}

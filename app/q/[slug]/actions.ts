"use server";

import { createClient } from "@/lib/supabase/server";

const DEFAULT_MAX_DAYS = 7;

export async function joinQueue(
  barbershopId: string,
  date: string,
  formData: {
    customer_name: string;
    phone?: string;
    service_id?: string;
    barber_id?: string;
  }
) {
  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0];

  // Validate: date cannot be in the past
  if (date < today) {
    return { error: "Tidak bisa mendaftar untuk tanggal yang sudah lewat." };
  }

  // Validate: date cannot exceed booking window
  const maxDaysDate = new Date();
  maxDaysDate.setDate(maxDaysDate.getDate() + DEFAULT_MAX_DAYS);
  const maxDaysStr = maxDaysDate.toISOString().split("T")[0];

  if (date > maxDaysStr) {
    return { error: `Maksimal booking ${DEFAULT_MAX_DAYS} hari ke depan.` };
  }

  // Fetch or auto-create queue row for the selected date
  const { data: existingQueue } = await supabase
    .from("queues")
    .select("id, is_open")
    .eq("barbershop_id", barbershopId)
    .eq("date", date)
    .maybeSingle();

  let queueId: string;
  let isOpen: boolean;

  if (existingQueue) {
    queueId = existingQueue.id;
    isOpen = existingQueue.is_open;
  } else {
    // Auto-create queue with is_open: false
    const { data: newQueue, error: queueError } = await supabase
      .from("queues")
      .upsert(
        { barbershop_id: barbershopId, date, is_open: false },
        { onConflict: "barbershop_id,date" }
      )
      .select("id, is_open")
      .maybeSingle();

    if (queueError) return { error: queueError.message };
    if (!newQueue) return { error: "Gagal membuat antrian." };
    queueId = newQueue.id;
    isOpen = newQueue.is_open;
  }

  // Check is_open + date logic
  if (!isOpen && date === today) {
    return { error: "Antrian belum dibuka." };
  }

  // Enforce daily queue limit from subscription
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("max_queue_per_day")
    .eq("barbershop_id", barbershopId)
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

  const customerName = formData.customer_name.trim();
  if (!customerName) {
    return { error: "Nama tidak boleh kosong." };
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
      customer_name: customerName,
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

"use server";

import { createClient } from "@/lib/supabase/server";
import { enqueueWANotification } from "@/lib/wa-queue";
import { normalizePhone } from "@/lib/phone";

export async function createBooking(
  barbershopId: string,
  form: {
    customer_name: string;
    phone: string;
    barber_id?: string;
    service_id?: string;
    scheduled_at: string;
    notes?: string;
  }
) {
  const supabase = await createClient();

  // Fetch barbershop name, barber name, service name for template
  const [{ data: barbershop }, { data: service }, { data: barber }] =
    await Promise.all([
      supabase.from("barbershops").select("name").eq("id", barbershopId).single(),
      form.service_id
        ? supabase.from("services").select("name").eq("id", form.service_id).single()
        : Promise.resolve({ data: null }),
      form.barber_id
        ? supabase.from("barbers").select("display_name").eq("id", form.barber_id).single()
        : Promise.resolve({ data: null }),
    ]);

  const normalizedPhone = normalizePhone(form.phone);

  const { data, error } = await supabase
    .from("bookings")
    .insert({
      barbershop_id: barbershopId,
      customer_name: form.customer_name.trim(),
      phone: normalizedPhone,
      barber_id: form.barber_id || null,
      service_id: form.service_id || null,
      scheduled_at: form.scheduled_at,
      notes: form.notes?.trim() || null,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  // Fire-and-forget WA notification
  const scheduledDate = new Date(form.scheduled_at);
  await enqueueWANotification(
    barbershopId,
    normalizedPhone,
    form.customer_name.trim(),
    "booking_confirmed",
    {
      date: scheduledDate.toLocaleDateString("id-ID", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      time: scheduledDate.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      service: service?.name || "",
      barber: barber?.display_name || "",
    }
  );

  return { data };
}

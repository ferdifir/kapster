"use server";

import { createClient } from "@/lib/supabase/server";

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
  const { data, error } = await supabase
    .from("bookings")
    .insert({
      barbershop_id: barbershopId,
      customer_name: form.customer_name.trim(),
      phone: form.phone.trim(),
      barber_id: form.barber_id || null,
      service_id: form.service_id || null,
      scheduled_at: form.scheduled_at,
      notes: form.notes?.trim() || null,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  return { data };
}

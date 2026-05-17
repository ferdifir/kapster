"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { Json } from "@/lib/supabase/types";

export async function updateBarbershopSettings(
  barbershopId: string,
  form: {
    name: string;
    address?: string;
    city?: string;
    phone?: string;
    wa_number?: string;
  }
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("barbershops")
    .update({
      name: form.name.trim(),
      address: form.address?.trim() || null,
      city: form.city?.trim() || null,
      phone: form.phone?.trim() || null,
      wa_number: form.wa_number?.trim() || null,
    })
    .eq("id", barbershopId);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard");
  return {};
}

export async function updateBarbershopLocation(
  barbershopId: string,
  latitude: number,
  longitude: number
) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("barbershops")
    .update({ latitude, longitude })
    .eq("id", barbershopId);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/settings");
  return { success: true };
}

export async function updateBookingMaxDays(
  barbershopId: string,
  bookingMaxDays: number
) {
  const supabase = await createClient();

  const { data: current } = await supabase
    .from("barbershops")
    .select("settings_json")
    .eq("id", barbershopId)
    .single();

  const settings = (current?.settings_json as Record<string, unknown>) ?? {};
  settings.booking_max_days = bookingMaxDays;

  const { error } = await supabase
    .from("barbershops")
    .update({ settings_json: settings as Json })
    .eq("id", barbershopId);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/settings");
  revalidatePath("/q");
  return {};
}

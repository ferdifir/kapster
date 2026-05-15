"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function addService(
  barbershopId: string,
  form: { name: string; price: number; duration_min: number }
) {
  const supabase = await createClient();
  const { error } = await supabase.from("services").insert({
    barbershop_id: barbershopId,
    name: form.name.trim(),
    price: form.price,
    duration_min: form.duration_min,
  });

  if (error) return { error: error.message };
  revalidatePath("/dashboard/services");
  return {};
}

export async function updateService(
  serviceId: string,
  form: { name: string; price: number; duration_min: number }
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("services")
    .update({ name: form.name.trim(), price: form.price, duration_min: form.duration_min })
    .eq("id", serviceId);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/services");
  return {};
}

export async function toggleServiceActive(serviceId: string, isActive: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("services")
    .update({ is_active: isActive })
    .eq("id", serviceId);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/services");
  return {};
}

export async function deleteService(serviceId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("services").delete().eq("id", serviceId);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/services");
  return {};
}

"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

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

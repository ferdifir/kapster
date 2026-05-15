"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";

export async function addBarber(barbershopId: string, displayName: string) {
  const supabase = await createClient();
  const token = randomUUID();

  const { data, error } = await supabase
    .from("barbers")
    .insert({
      barbershop_id: barbershopId,
      display_name: displayName.trim(),
      invite_token: token,
    })
    .select("id, invite_token")
    .single();

  if (error) return { error: error.message };
  revalidatePath("/dashboard/barbers");
  return { data };
}

export async function toggleBarberActive(barberId: string, isActive: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("barbers")
    .update({ is_active: isActive })
    .eq("id", barberId);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/barbers");
  return {};
}

export async function deleteBarber(barberId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("barbers").delete().eq("id", barberId);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/barbers");
  return {};
}

export async function regenerateInviteToken(barberId: string) {
  const supabase = await createClient();
  const token = randomUUID();
  const { data, error } = await supabase
    .from("barbers")
    .update({ invite_token: token })
    .eq("id", barberId)
    .select("invite_token")
    .single();

  if (error) return { error: error.message };
  revalidatePath("/dashboard/barbers");
  return { data };
}

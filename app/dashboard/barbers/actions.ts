"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";
import { sendTextMessage, SYSTEM_WUZAPI_TOKEN } from "@/lib/wuzapi";
import { normalizePhone } from "@/lib/phone";
import { WA_FOOTER } from "@/lib/wa-templates";

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

export async function sendInviteViaWhatsApp(
  barbershopId: string,
  barberId: string,
  barberName: string,
  phone: string
) {
  const supabase = await createClient();

  // Get barbershop WA credentials
  const { data: barbershop } = await supabase
    .from("barbershops")
    .select("name, wuzapi_token, wa_connected")
    .eq("id", barbershopId)
    .single();

  if (!barbershop) return { error: "Barbershop tidak ditemukan." };

  let token = barbershop.wuzapi_token;
  if (!barbershop.wa_connected || !token) {
    if (!SYSTEM_WUZAPI_TOKEN) {
      return { error: "WhatsApp belum terhubung. Hubungkan WhatsApp di Pengaturan atau hubungi admin untuk mengaktifkan sistem WhatsApp." };
    }
    token = SYSTEM_WUZAPI_TOKEN;
  }

  // Get invite token
  const { data: barber } = await supabase
    .from("barbers")
    .select("invite_token")
    .eq("id", barberId)
    .single();

  if (!barber || !barber.invite_token) return { error: "Token undangan tidak ditemukan." };

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://kapster.my.id";
  const inviteUrl = `${baseUrl}/barber/invite/${barber.invite_token}`;
  const message = `Halo ${barberName}! 👋\n\nAnda diundang untuk bergabung sebagai barber di *${barbershop.name}*.\n\nKlik link berikut untuk mulai mengelola antrian:\n${inviteUrl}\n\n— ${barbershop.name} via Kapster${WA_FOOTER}`;

  const normalizedPhone = normalizePhone(phone);
  const result = await sendTextMessage(token, normalizedPhone, message);

  if (!result.success) {
    return { error: result.error || "Gagal mengirim pesan WhatsApp." };
  }

  return {};
}

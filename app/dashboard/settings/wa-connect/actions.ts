"use server";

import { createClient } from "@/lib/supabase/server";
import {
  createWuzApiUser,
  deleteWuzApiUser,
  connectSession,
  getQrCode,
  getSessionStatus,
  disconnectSession,
} from "@/lib/wuzapi";
import { revalidatePath } from "next/cache";

export async function connectWhatsApp(barbershopId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: barbershop } = await supabase
    .from("barbershops")
    .select("wuzapi_user_id, wuzapi_token, wa_connected")
    .eq("id", barbershopId)
    .eq("owner_id", user.id)
    .single();

  if (!barbershop) return { error: "Barbershop not found" };

  // Check if WuzAPI is configured
  if (!process.env.WUZAPI_ADMIN_TOKEN) {
    return { error: "WhatsApp belum dikonfigurasi. Hubungi admin untuk setup WUZAPI_ADMIN_TOKEN." };
  }

  // If already has credentials, just try to connect
  if (barbershop.wuzapi_user_id && barbershop.wuzapi_token) {
    const result = await connectSession(barbershop.wuzapi_token);
    if (!result) return { error: "Gagal connect ke WhatsApp. Pastikan WuzAPI server berjalan." };

    const { error: updateError } = await supabase
      .from("barbershops")
      .update({ wa_connected: false })
      .eq("id", barbershopId);

    if (updateError) return { error: updateError.message };
    revalidatePath("/dashboard/settings");
    return { success: true, needsQr: !result.loggedIn };
  }

  // Create new WuzAPI user
  const newUser = await createWuzApiUser(barbershopId);
  if (!newUser) return { error: "Gagal membuat akun WhatsApp. Periksa koneksi ke WuzAPI server." };

  const { error: updateError } = await supabase
    .from("barbershops")
    .update({
      wuzapi_user_id: newUser.userId,
      wuzapi_token: newUser.token,
      wa_connected: false,
    })
    .eq("id", barbershopId);

  if (updateError) {
    await deleteWuzApiUser(newUser.userId);
    return { error: updateError.message };
  }

  // Connect session
  const result = await connectSession(newUser.token);
  if (!result) return { error: "Gagal connect session ke WhatsApp." };

  revalidatePath("/dashboard/settings");
  return { success: true, needsQr: !result.loggedIn };
}

export async function getWhatsAppQr(barbershopId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: barbershop } = await supabase
    .from("barbershops")
    .select("wuzapi_token")
    .eq("id", barbershopId)
    .eq("owner_id", user.id)
    .single();

  if (!barbershop?.wuzapi_token) return { error: "WhatsApp not configured" };

  const qr = await getQrCode(barbershop.wuzapi_token);
  if (!qr) return { error: "Gagal mengambil QR code" };

  return { qr };
}

export async function checkWhatsAppStatus(barbershopId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: barbershop } = await supabase
    .from("barbershops")
    .select("wuzapi_token, wa_connected")
    .eq("id", barbershopId)
    .eq("owner_id", user.id)
    .single();

  if (!barbershop?.wuzapi_token) return { error: "WhatsApp not configured" };

  const status = await getSessionStatus(barbershop.wuzapi_token);
  if (!status) return { error: "Gagal cek status" };

  // Update DB if newly connected
  if (status.loggedIn && !barbershop.wa_connected) {
    const phoneNumber = status.jid.replace("@s.whatsapp.net", "");
    await supabase
      .from("barbershops")
      .update({ wa_connected: true, wa_phone_number: phoneNumber })
      .eq("id", barbershopId);
  }

  revalidatePath("/dashboard/settings");
  return { connected: status.connected, loggedIn: status.loggedIn, jid: status.jid };
}

export async function disconnectWhatsApp(barbershopId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: barbershop } = await supabase
    .from("barbershops")
    .select("wuzapi_token, wuzapi_user_id")
    .eq("id", barbershopId)
    .eq("owner_id", user.id)
    .single();

  if (!barbershop?.wuzapi_token) return { error: "WhatsApp not configured" };

  await disconnectSession(barbershop.wuzapi_token);

  await supabase
    .from("barbershops")
    .update({ wa_connected: false, wa_phone_number: null })
    .eq("id", barbershopId);

  revalidatePath("/dashboard/settings");
  return { success: true };
}

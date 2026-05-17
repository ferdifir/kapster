"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
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

  // Verify ownership
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: barbershop } = await supabase
    .from("barbershops")
    .select("id, settings_json")
    .eq("id", barbershopId)
    .eq("owner_id", user.id)
    .single();

  if (!barbershop) return { error: "Unauthorized" };

  if (bookingMaxDays < 1 || bookingMaxDays > 365) {
    return { error: "Batas hari booking harus antara 1 dan 365." };
  }

  const settings = (barbershop.settings_json as Record<string, unknown>) ?? {};
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

export async function updateBarbershopLogo(
  barbershopId: string,
  logoUrl: string
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: barbershop } = await supabase
    .from("barbershops")
    .select("id, logo_url, owner_id")
    .eq("id", barbershopId)
    .eq("owner_id", user.id)
    .single();

  if (!barbershop) return { error: "Unauthorized" };

  // Delete old logo from storage if it exists and is different
  if (barbershop.logo_url && barbershop.logo_url !== logoUrl) {
    try {
      const oldUrl = new URL(barbershop.logo_url);
      const pathParts = oldUrl.pathname.split("/storage/v1/object/public/logos/");
      if (pathParts.length === 2) {
        const oldPath = decodeURIComponent(pathParts[1]);
        const admin = createAdminClient();
        await admin.storage.from("logos").remove([oldPath]);
      }
    } catch {
      // Silently ignore cleanup errors — old logo will remain orphaned
    }
  }

  const { error } = await supabase
    .from("barbershops")
    .update({ logo_url: logoUrl })
    .eq("id", barbershopId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/settings");
  revalidatePath("/display/[slug]");
  revalidatePath("/q/[slug]");

  return {};
}

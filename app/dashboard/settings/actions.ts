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
  revalidatePath("/display/[slug]", "page");
  revalidatePath("/q/[slug]", "page");

  return {};
}

export async function updateBarbershopCoverImage(
  barbershopId: string,
  coverImageUrl: string
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: barbershop } = await supabase
    .from("barbershops")
    .select("id, cover_image_url, owner_id")
    .eq("id", barbershopId)
    .eq("owner_id", user.id)
    .single();

  if (!barbershop) return { error: "Unauthorized" };

  // Delete old cover image from storage if it exists and is different
  if (barbershop.cover_image_url && barbershop.cover_image_url !== coverImageUrl) {
    try {
      const oldUrl = new URL(barbershop.cover_image_url);
      const pathParts = oldUrl.pathname.split("/storage/v1/object/public/cover-images/");
      if (pathParts.length === 2) {
        const oldPath = decodeURIComponent(pathParts[1]);
        const admin = createAdminClient();
        await admin.storage.from("cover-images").remove([oldPath]);
      }
    } catch {
      // Silently ignore cleanup errors
    }
  }

  const { error } = await supabase
    .from("barbershops")
    .update({ cover_image_url: coverImageUrl })
    .eq("id", barbershopId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/settings");
  revalidatePath("/q/[slug]", "page");

  return {};
}

export async function updateBarbershopAbout(
  barbershopId: string,
  about: string
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: barbershop } = await supabase
    .from("barbershops")
    .select("id, owner_id")
    .eq("id", barbershopId)
    .eq("owner_id", user.id)
    .single();

  if (!barbershop) return { error: "Unauthorized" };

  const { error } = await supabase
    .from("barbershops")
    .update({ about: about.trim() || null })
    .eq("id", barbershopId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/settings");
  revalidatePath("/q/[slug]", "page");

  return {};
}

export async function updateBarbershopGallery(
  barbershopId: string,
  galleryImages: string[]
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: barbershop } = await supabase
    .from("barbershops")
    .select("id, settings_json, owner_id")
    .eq("id", barbershopId)
    .eq("owner_id", user.id)
    .single();

  if (!barbershop) return { error: "Unauthorized" };

  const settings = (barbershop.settings_json as Record<string, unknown>) ?? {};
  settings.gallery_images = galleryImages.slice(0, 12); // Max 12 images

  const { error } = await supabase
    .from("barbershops")
    .update({ settings_json: settings as Json })
    .eq("id", barbershopId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/settings");
  revalidatePath("/q/[slug]", "page");

  return {};
}

export async function addGalleryImage(
  barbershopId: string,
  imageUrl: string
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: barbershop } = await supabase
    .from("barbershops")
    .select("id, settings_json, owner_id")
    .eq("id", barbershopId)
    .eq("owner_id", user.id)
    .single();

  if (!barbershop) return { error: "Unauthorized" };

  const settings = (barbershop.settings_json as Record<string, unknown>) ?? {};
  const currentImages = (settings.gallery_images as string[]) ?? [];
  
  if (currentImages.length >= 12) {
    return { error: "Maksimal 12 gambar galeri." };
  }

  settings.gallery_images = [...currentImages, imageUrl];

  const { error } = await supabase
    .from("barbershops")
    .update({ settings_json: settings as Json })
    .eq("id", barbershopId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/settings");
  revalidatePath("/q/[slug]", "page");

  return {};
}

export async function removeGalleryImage(
  barbershopId: string,
  imageUrl: string
) {
  const supabase = await createClient();
  const admin = createAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: barbershop } = await supabase
    .from("barbershops")
    .select("id, settings_json, owner_id")
    .eq("id", barbershopId)
    .eq("owner_id", user.id)
    .single();

  if (!barbershop) return { error: "Unauthorized" };

  const settings = (barbershop.settings_json as Record<string, unknown>) ?? {};
  const currentImages = (settings.gallery_images as string[]) ?? [];
  const updatedImages = currentImages.filter((img: string) => img !== imageUrl);

  settings.gallery_images = updatedImages;

  // Delete from storage
  try {
    const url = new URL(imageUrl);
    const pathParts = url.pathname.split("/storage/v1/object/public/gallery-images/");
    if (pathParts.length === 2) {
      const path = decodeURIComponent(pathParts[1]);
      await admin.storage.from("gallery-images").remove([path]);
    }
  } catch {
    // Silently ignore cleanup errors
  }

  const { error } = await supabase
    .from("barbershops")
    .update({ settings_json: settings as Json })
    .eq("id", barbershopId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/settings");
  revalidatePath("/q/[slug]", "page");

  return {};
}

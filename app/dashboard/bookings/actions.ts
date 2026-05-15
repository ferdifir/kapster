"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateBookingStatus(
  bookingId: string,
  status: "confirmed" | "cancelled" | "done"
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("bookings")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", bookingId);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/bookings");
  return {};
}

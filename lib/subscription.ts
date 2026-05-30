import { type NextRequest, NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./supabase/types";

export async function checkSubscription(
  supabase: SupabaseClient<Database>,
  userId: string,
  request: NextRequest
): Promise<{ hasAccess: boolean; redirect?: NextResponse }> {
  const { data: barbershop } = await supabase
    .from("barbershops")
    .select("id")
    .eq("owner_id", userId)
    .maybeSingle();

  if (!barbershop) {
    return { hasAccess: false, redirect: NextResponse.redirect(new URL("/onboarding", request.url)) };
  }

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("status, current_period_end")
    .eq("barbershop_id", barbershop.id)
    .maybeSingle();

  if (!subscription) {
    return { hasAccess: false, redirect: NextResponse.redirect(new URL("/billing", request.url)) };
  }

  const now = new Date().toISOString();

  if (subscription.current_period_end < now) {
    await supabase
      .from("subscriptions")
      .update({ status: "expired", updated_at: now })
      .eq("barbershop_id", barbershop.id);

    return { hasAccess: false, redirect: NextResponse.redirect(new URL("/billing", request.url)) };
  }

  if (subscription.status !== "active" && subscription.status !== "cancelled") {
    return { hasAccess: false, redirect: NextResponse.redirect(new URL("/billing", request.url)) };
  }

  return { hasAccess: true };
}

"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { sendTelegramNotification } from "@/lib/telegram";
import { insertAgentEvent } from "@/lib/events";

export async function submitFeedback(form: {
  barbershopId: string;
  profileId: string | null;
  name: string;
  category: string;
  message: string;
  screenshotUrl: string | null;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { error: insertError } = await supabase.from("feedback").insert({
    barbershop_id: form.barbershopId,
    profile_id: form.profileId,
    name: form.name.trim(),
    category: form.category,
    message: form.message.trim(),
    screenshot_url: form.screenshotUrl,
  });

  if (insertError) return { error: insertError.message };

  const { data: barbershop } = await supabase
    .from("barbershops")
    .select("name")
    .eq("id", form.barbershopId)
    .single();

  const truncated = form.message.length > 200 ? form.message.slice(0, 200) + "..." : form.message;

  const categoryLabels: Record<string, string> = {
    kritik: "Kritik", saran: "Saran", feedback: "Feedback", request_fitur: "Request Fitur",
  };

  const notification = [
    `📩 <b>Feedback Baru dari ${form.name}</b>`,
    `🏪 ${barbershop?.name ?? "Barbershop"}`,
    `📂 Kategori: ${categoryLabels[form.category] ?? form.category}`,
    ``,
    truncated,
  ].join("\n");

  sendTelegramNotification(notification);

  insertAgentEvent("complaint", "feedback", {
    name: form.name,
    category: form.category,
    message: form.message.slice(0, 500),
    barbershopId: form.barbershopId,
  }, 2, "hustler").catch(() => {});

  revalidatePath("/dashboard/feedback");
  return {};
}

export async function getFeedbackList(barbershopId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized", data: [] };

  const { data, error } = await supabase
    .from("feedback")
    .select("*")
    .eq("barbershop_id", barbershopId)
    .order("created_at", { ascending: false });

  if (error) return { error: error.message, data: [] };
  return { data, error: null };
}

export async function markFeedbackAsRead(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { error } = await supabase.from("feedback").update({ is_read: true }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/dashboard/feedback");
  return {};
}

export async function deleteFeedback(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: feedback } = await supabase
    .from("feedback")
    .select("screenshot_url")
    .eq("id", id)
    .single();

  if (feedback?.screenshot_url) {
    try {
      const url = new URL(feedback.screenshot_url);
      const pathParts = url.pathname.split("/storage/v1/object/public/feedback/");
      if (pathParts.length === 2) {
        const { createAdminClient } = await import("@/lib/supabase/admin");
        const admin = createAdminClient();
        await admin.storage.from("feedback").remove([decodeURIComponent(pathParts[1])]);
      }
    } catch { /* ignore */ }
  }

  const { error } = await supabase.from("feedback").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/dashboard/feedback");
  return {};
}

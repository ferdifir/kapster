"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function updateLeadStatus(leadId: string, status: string) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("marketing_leads")
    .update({
      status,
      last_contacted_at: status === "contacted" ? new Date().toISOString() : undefined,
    })
    .eq("id", leadId);
  if (error) throw new Error(error.message);

  const statusLabels: Record<string, string> = {
    new: "Baru",
    contacted: "Sudah Dihubungi",
    interested: "Tertarik",
    demo: "Demo",
    customer: "Customer",
    closed: "Tutup",
  };

  await supabase.from("marketing_lead_activities").insert({
    lead_id: leadId,
    activity_type: "status_change",
    description: `Status berubah: ${statusLabels[status] || status}`,
  });

  revalidatePath("/admin/marketing");
}

export async function addLeadNote(leadId: string, note: string) {
  const supabase = createAdminClient();

  const { error: updateError } = await supabase
    .from("marketing_leads")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", leadId);
  if (updateError) throw new Error(updateError.message);

  const { error } = await supabase.from("marketing_lead_activities").insert({
    lead_id: leadId,
    activity_type: "note",
    description: note,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/admin/marketing");
}

export async function createLead(data: {
  name: string;
  contact: string;
  branches?: string;
  city?: string;
  instagram?: string;
  priority: string;
  notes?: string;
}) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("marketing_leads").insert({
    name: data.name,
    contact: data.contact,
    branches: data.branches || null,
    city: data.city || null,
    instagram: data.instagram || null,
    priority: data.priority,
    notes: data.notes || null,
    status: "new",
  });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/marketing");
}

export async function deleteLead(leadId: string) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("marketing_leads")
    .delete()
    .eq("id", leadId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/marketing");
}

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import MarketingManager from "@/components/dashboard/MarketingManager";

export const dynamic = "force-dynamic";

export default async function MarketingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: leads } = await supabase
    .from("marketing_leads")
    .select("*")
    .order("created_at", { ascending: false });

  const { data: activities } = await supabase
    .from("marketing_lead_activities")
    .select("*")
    .order("created_at", { ascending: false });

  const activitiesByLead: Record<string, typeof activities> = {};
  if (activities) {
    for (const a of activities) {
      if (!activitiesByLead[a.lead_id]) activitiesByLead[a.lead_id] = [];
      activitiesByLead[a.lead_id].push(a);
    }
  }

  const total = leads?.length ?? 0;
  const newCount = leads?.filter((l) => l.status === "new").length ?? 0;
  const contacted = leads?.filter((l) => l.status === "contacted").length ?? 0;
  const interested = leads?.filter((l) => l.status === "interested").length ?? 0;
  const demo = leads?.filter((l) => l.status === "demo").length ?? 0;
  const customer = leads?.filter((l) => l.status === "customer").length ?? 0;
  const closed = leads?.filter((l) => l.status === "closed").length ?? 0;

  const stats = {
    total,
    new: newCount,
    contacted,
    interested,
    demo,
    customer,
    closed,
    conversion_rate: total > 0 ? Math.round((customer / total) * 100) : 0,
  };

  return (
    <MarketingManager
      initialLeads={leads ?? []}
      initialActivitiesByLead={activitiesByLead}
      stats={stats}
    />
  );
}

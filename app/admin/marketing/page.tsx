import { createAdminClient } from "@/lib/supabase/admin";
import type { MarketingLeadActivity } from "@/lib/marketing-types";
import MarketingManager from "@/components/dashboard/MarketingManager";

export default async function MarketingPage() {
  const supabase = createAdminClient();

  const { data: leads } = await supabase
    .from("marketing_leads")
    .select("*")
    .order("created_at", { ascending: false });

  const { data: activities } = await supabase
    .from("marketing_lead_activities")
    .select("*")
    .order("created_at", { ascending: false });

  const activitiesByLead: Record<string, MarketingLeadActivity[]> = {};
  if (activities) {
    for (const a of activities) {
      const item = a as MarketingLeadActivity;
      const list = activitiesByLead[item.lead_id];
      if (list) {
        list.push(item);
      } else {
        activitiesByLead[item.lead_id] = [item];
      }
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

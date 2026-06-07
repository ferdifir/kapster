import { createClient } from "@supabase/supabase-js";

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface RevenueData {
  daily: { date: string; revenue: number }[];
  total: number;
}

export interface ChurnData {
  rate: number;
  periodDays: number;
}

export async function getRevenue(days = 30): Promise<RevenueData> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data } = await db
    .from("analytics_daily")
    .select("date, revenue")
    .gte("date", startDate.toISOString().split("T")[0])
    .order("date", { ascending: true });

  const rows = (data ?? []) as unknown as { date: string; revenue: number }[];
  const total = rows.reduce((sum, r) => sum + (r.revenue ?? 0), 0);

  return { daily: rows, total };
}

export async function getChurnRate(days = 30): Promise<ChurnData> {
  return { rate: 0, periodDays: days };
}

export async function getActiveSubscribers(): Promise<number> {
  const { count } = await db
    .from("barbershops")
    .select("id", { count: "exact", head: true })
    .eq("subscription_status", "active");

  return count ?? 0;
}

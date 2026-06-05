import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const CRON_SECRET = process.env.CRON_SECRET;

type SupabaseAny = ReturnType<typeof createAdminClient> & {
  from: (t: string) => {
    select: (c?: string) => {
      eq: (c: string, v: string) => Promise<{ data: Record<string, unknown>[] | null }>;
    };
    insert: (v: Record<string, unknown>) => Promise<{ error: { message: string } | null }>;
  };
};

function s(): SupabaseAny {
  return createAdminClient() as unknown as SupabaseAny;
}

export async function GET(request: NextRequest) {
  const auth = request.headers.get("authorization")?.replace("Bearer ", "");
  if (auth !== CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { data: activePlans } = await s().from("agent_plans").select("agent_role").eq("status", "active");
    if (!activePlans || activePlans.length === 0) {
      return NextResponse.json({ ok: true, events: 0, message: "No active plans" });
    }

    const roles = [...new Set(activePlans.map((r) => String(r.agent_role)))];
    let inserted = 0;

    for (const role of roles) {
      const { error } = await s().from("agent_events").insert({
        event_type: "scheduled",
        source: "cron",
        target_agent: role,
        payload: { reason: "plan_review", target_role: role },
        priority: 3,
      } as Record<string, unknown>);

      if (!error) inserted++;
    }

    return NextResponse.json({ ok: true, events: inserted, roles });
  } catch (err) {
    console.error("[cron] agent-plan-review error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export const POST = GET;

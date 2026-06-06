import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const CRON_SECRET = process.env.CRON_SECRET;

type SupabaseAny = ReturnType<typeof createAdminClient> & {
  from: (t: string) => {
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
    const meetingId = crypto.randomUUID();
    const { error } = await s().from("agent_events").insert({
      event_type: "daily_standup",
      source: "cron",
      target_agent: "hustler",
      payload: { meeting_id: meetingId, round: 1, transcript: [] },
      priority: 1,
    });

    if (error) throw new Error(error.message);

    return NextResponse.json({ ok: true, meeting_id: meetingId });
  } catch (err) {
    console.error("[cron] daily-standup error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export const POST = GET;

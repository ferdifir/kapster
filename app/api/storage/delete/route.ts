import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  const { bucket, path } = await req.json();

  if (!bucket || !path) {
    return NextResponse.json({ error: "Missing bucket or path" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin.storage.from(bucket).remove([path]);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

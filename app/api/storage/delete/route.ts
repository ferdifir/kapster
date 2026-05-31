import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logError } from "@/lib/error-logger";

export async function POST(req: NextRequest) {
  try {
    const { bucket, path } = await req.json();

    if (!bucket || !path) {
      return NextResponse.json({ error: "Missing bucket or path" }, { status: 400 });
    }

    const admin = createAdminClient();
    const { error } = await admin.storage.from(bucket).remove([path]);

    if (error) {
      logError("api/storage/delete", error.message, { bucket, path });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    logError("api/storage/delete", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

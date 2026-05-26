import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const bucket = formData.get("bucket") as string | null;
  const path = formData.get("path") as string | null;

  if (!file || !bucket || !path) {
    return NextResponse.json({ error: "Missing file, bucket, or path" }, { status: 400 });
  }

  const admin = createAdminClient();
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error: uploadError } = await admin.storage
    .from(bucket)
    .upload(path, buffer, {
      contentType: file.type,
      upsert: true,
    });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: { publicUrl } } = admin.storage
    .from(bucket)
    .getPublicUrl(path);

  return NextResponse.json({ url: publicUrl });
}

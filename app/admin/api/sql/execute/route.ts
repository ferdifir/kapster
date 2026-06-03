import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const BLOCKED_COMMANDS = /^\s*(DROP|TRUNCATE|ALTER|CREATE|GRANT|REVOKE)\b/i;

export async function POST(request: NextRequest) {
  try {
    const { query, allowWrite } = await request.json();

    if (!query || typeof query !== "string") {
      return NextResponse.json({ error: "Query diperlukan" }, { status: 400 });
    }

    if (BLOCKED_COMMANDS.test(query)) {
      return NextResponse.json({ error: "DDL tidak diizinkan (DROP/TRUNCATE/ALTER/CREATE/GRANT/REVOKE)" }, { status: 403 });
    }

    const trimmedQuery = query.trim().toUpperCase();
    const isWrite = trimmedQuery.startsWith("INSERT") || trimmedQuery.startsWith("UPDATE") || trimmedQuery.startsWith("DELETE");

    if (isWrite && !allowWrite) {
      return NextResponse.json({ error: "Mode read-only. Aktifkan toggle write untuk INSERT/UPDATE/DELETE." }, { status: 403 });
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase.rpc("exec_sql", { query_text: query });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ data, isWrite });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

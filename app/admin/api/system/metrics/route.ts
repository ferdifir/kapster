import { NextResponse } from "next/server";
import { execSync } from "child_process";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const uptime = execSync("uptime -p").toString().trim();
    const cpuInfo = execSync("top -bn1 | grep 'Cpu(s)' | awk '{print $2}'").toString().trim();
    const memInfo = execSync("free -m | awk 'NR==2{printf \"%s/%sMB (%.1f%%)\", $3, $2, $3*100/$2}'").toString().trim();
    const diskInfo = execSync("df -h / | awk 'NR==2{printf \"%s/%s (%s)\", $3, $2, $5}'").toString().trim();

    let dbConnections = 0;
    try {
      const dbRes = await createAdminClient().rpc("exec_sql", { query_text: "SELECT count(*) as cnt FROM pg_stat_activity" });
      const rows = dbRes.data as unknown as { cnt: number }[] | null;
      dbConnections = rows?.[0]?.cnt ?? 0;
    } catch { /* pg_stat_activity may not be accessible */ }

    const blogCron = execSync("grep 'generate-blog' /var/log/cron.log 2>/dev/null || echo 'no log'").toString().trim();
    const seoCron = execSync("grep 'seo-audit' /var/log/cron.log 2>/dev/null || echo 'no log'").toString().trim();

    return NextResponse.json({
      server: { uptime, cpu: cpuInfo || "N/A", memory: memInfo, disk: diskInfo },
      database: { connections: dbConnections },
      cron: { blog: blogCron.slice(-100), seo: seoCron.slice(-100) },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json({ error: String(err), timestamp: new Date().toISOString() }, { status: 500 });
  }
}

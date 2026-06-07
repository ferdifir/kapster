import { createAdminClient } from "@/lib/supabase/admin";

function StatCard({ label, value, sub, accent }: { label: string; value: string | number; sub?: string; accent?: boolean }) {
  return (
    <div className={`p-6 rounded-2xl border ${accent ? "bg-barber-400/10 border-barber-400/30" : "bg-dark-800/50 border-dark-700/30"}`}>
      <p className="text-dark-400 text-sm mb-1">{label}</p>
      <p className={`font-display text-3xl font-bold ${accent ? "text-barber-400" : "text-white"}`}>{value}</p>
      {sub && <p className="text-dark-500 text-xs mt-1">{sub}</p>}
    </div>
  );
}

function LogRow({ log }: { log: { agent_id: string; action: string; details: Record<string, unknown> | null; created_at: string } }) {
  const agentColors: Record<string, string> = {
    hacker: "text-green-400",
    hipster: "text-purple-400",
    hustler: "text-yellow-400",
    coo: "text-blue-400",
  };

  return (
    <div className="flex items-start gap-3 py-3 border-b border-dark-800/30 last:border-0">
      <span className={`text-xs font-mono font-semibold uppercase shrink-0 w-16 ${agentColors[log.agent_id] ?? "text-dark-400"}`}>
        {log.agent_id}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-white truncate">{log.action}</p>
        {log.details && typeof log.details === "object" && (
          <p className="text-xs text-dark-500 truncate mt-0.5">{JSON.stringify(log.details).slice(0, 120)}</p>
        )}
      </div>
      <span className="text-xs text-dark-500 shrink-0">
        {new Date(log.created_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
      </span>
    </div>
  );
}

export default async function AgentsPage() {
  const supabase = createAdminClient();

  const tasks = (await supabase.from("agent_tasks" as any).select("status")).data as { status: string }[] | null;
  const logCount = (await supabase.from("agent_logs" as any).select("*", { count: "exact", head: true })).count;
  const subAgents = (await supabase.from("agent_memory" as any).select("value").eq("key", "sub_agents").single()).data as { value: unknown } | null;
  const approvalsResult = (await supabase.from("agent_memory" as any).select("value").eq("key", "approval_queue").single()).data as { value: { status: string }[] } | null;
  const recentLogs = (await supabase.from("agent_logs" as any).select("*").order("created_at", { ascending: false }).limit(20)).data as { agent_id: string; action: string; details: Record<string, unknown> | null; created_at: string }[] | null;

  const pending = tasks?.filter((t) => t.status === "pending").length ?? 0;
  const inProgress = tasks?.filter((t) => t.status === "in_progress").length ?? 0;
  const completed = tasks?.filter((t) => t.status === "completed").length ?? 0;
  const failed = tasks?.filter((t) => t.status === "failed" || t.status === "cancelled").length ?? 0;

  const approvals = (approvalsResult?.value ?? []).filter((a) => a.status === "pending");

  const today = new Date().toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-white mb-1">AI Agents</h1>
        <p className="text-dark-400 text-sm">{today}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4">
        <StatCard label="Total Tasks" value={tasks?.length ?? 0} accent />
        <StatCard label="Pending" value={pending} sub="menunggu dikerjakan" />
        <StatCard label="In Progress" value={inProgress} sub="sedang berjalan" />
        <StatCard label="Completed" value={completed} sub={`gagal ${failed}`} />
        <StatCard label="Approval" value={approvals.length} sub={approvals.length > 0 ? "butuh persetujuan" : "tidak ada"} accent />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-dark-800/50 border border-dark-700/30 rounded-2xl p-6">
          <h2 className="font-semibold text-white mb-4">Activity Log</h2>
          {recentLogs && recentLogs.length > 0 ? (
            <div className="divide-y divide-dark-800/30">
              {recentLogs.map((log) => (
                <LogRow key={log.created_at} log={log} />
              ))}
            </div>
          ) : (
            <p className="text-dark-500 text-sm">Belum ada aktivitas agent.</p>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-dark-800/50 border border-dark-700/30 rounded-2xl p-6">
            <h2 className="font-semibold text-white mb-4">Agent Status</h2>
            <div className="space-y-3">
              {[
                { id: "hacker", label: "Hacker", color: "text-green-400", desc: "Code & infrastructure" },
                { id: "hipster", label: "Hipster", color: "text-purple-400", desc: "Frontend & design" },
                { id: "hustler", label: "Hustler", color: "text-yellow-400", desc: "Business & growth" },
                { id: "coo", label: "COO", color: "text-blue-400", desc: "Orchestrator" },
              ].map((agent) => (
                <div key={agent.id} className="flex items-center gap-3 p-3 rounded-xl bg-dark-900/50">
                  <div className={`w-2 h-2 rounded-full bg-current ${agent.color}`} />
                  <div className="flex-1">
                    <p className={`text-sm font-semibold ${agent.color}`}>{agent.label}</p>
                    <p className="text-xs text-dark-500">{agent.desc}</p>
                  </div>
                  <span className="text-xs text-dark-400">
                    {agent.id === "coo" ? "active" : subAgents?.value ? "active" : "idle"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {approvals.length > 0 && (
            <div className="bg-dark-800/50 border border-dark-700/30 rounded-2xl p-6">
              <h2 className="font-semibold text-white mb-4">Pending Approval</h2>
              <p className="text-sm text-dark-400">
                {approvals.length} task{(approvals.length > 1) ? "s" : ""} perlu dicek.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

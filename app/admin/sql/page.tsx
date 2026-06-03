"use client";

import { useState, useRef } from "react";

const TEMPLATES = [
  { label: "Semua Barbershop", query: "SELECT id, name, slug, city, created_at FROM barbershops ORDER BY created_at DESC LIMIT 20;" },
  { label: "Subscriber Aktif", query: "SELECT bs.name, bs.city, s.current_period_end FROM subscriptions s JOIN barbershops bs ON bs.id = s.barbershop_id WHERE s.status = 'active' ORDER BY s.current_period_end DESC;" },
  { label: "Revenue Bulan Ini", query: "SELECT DATE_TRUNC('day', created_at) as day, SUM(amount) as total FROM payments WHERE status = 'completed' AND created_at >= DATE_TRUNC('month', NOW()) GROUP BY 1 ORDER BY 1;" },
  { label: "Top Barbershops by Customers", query: "SELECT bs.name, COUNT(qe.id) as total_customers FROM barbershops bs JOIN queue_entries qe ON qe.barbershop_id = bs.id WHERE qe.status = 'done' GROUP BY bs.id, bs.name ORDER BY total_customers DESC LIMIT 10;" },
  { label: "WhatsApp Pending", query: "SELECT COUNT(*) as pending FROM wa_notifications WHERE status = 'pending';" },
  { label: "Cek Subscription Expired", query: "SELECT bs.name, bs.owner_id, s.current_period_end FROM barbershops bs JOIN subscriptions s ON s.barbershop_id = bs.id WHERE s.status = 'active' AND s.current_period_end < NOW();" },
];

export default function AdminSqlPage() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<{ data: unknown[]; error?: string; isWrite?: boolean } | null>(null);
  const [loading, setLoading] = useState(false);
  const [allowWrite, setAllowWrite] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const execute = async (q: string) => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/admin/api/sql/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q, allowWrite }),
      });
      const json = await res.json();
      setResult(json);
      if (!json.error) {
        setHistory((prev) => [q, ...prev].slice(0, 20));
      }
    } catch (err) {
      setResult({ data: [], error: String(err) });
    }
    setLoading(false);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-white">SQL Query</h1>
        <label className="flex items-center gap-2 text-sm text-dark-400 cursor-pointer">
          <input type="checkbox" checked={allowWrite} onChange={(e) => setAllowWrite(e.target.checked)} className="rounded border-dark-600 bg-dark-700" />
          Izinkan INSERT/UPDATE/DELETE
        </label>
      </div>

      <div className="flex flex-wrap gap-2">
        {TEMPLATES.map((t) => (
          <button key={t.label} onClick={() => { setQuery(t.query); textareaRef.current?.focus(); }}
            className="px-3 py-1.5 rounded-lg bg-dark-800 border border-dark-700 text-dark-300 text-xs hover:border-barber-400/30 hover:text-barber-400 transition-all"
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        <textarea ref={textareaRef} value={query} onChange={(e) => setQuery(e.target.value)}
          placeholder="Masukkan SQL query..."
          className="w-full h-32 px-4 py-3 rounded-2xl bg-dark-800 border border-dark-700 text-white placeholder:text-dark-500 text-sm font-mono focus:outline-none focus:border-barber-400/50 resize-y"
        />
        <div className="flex gap-3">
          <button onClick={() => execute(query)} disabled={loading || !query.trim()}
            className="px-6 py-2 rounded-xl bg-barber-400/10 text-barber-400 border border-barber-400/20 text-sm hover:bg-barber-400/20 transition-all disabled:opacity-50"
          >
            {loading ? "Running..." : "▶ Execute"}
          </button>
          <button onClick={() => execute("EXPLAIN ANALYZE " + query)} disabled={loading || !query.trim()}
            className="px-4 py-2 rounded-xl bg-dark-800 text-dark-300 border border-dark-700 text-sm hover:text-white transition-all disabled:opacity-50"
          >
            EXPLAIN
          </button>
          <button onClick={() => setQuery("")} className="px-4 py-2 rounded-xl bg-dark-800 text-dark-400 border border-dark-700 text-sm hover:text-white transition-all">
            Clear
          </button>
        </div>
      </div>

      {result && (
        <div className="bg-dark-800/50 border border-dark-700/30 rounded-2xl overflow-hidden">
          {result.error ? (
            <div className="p-4 text-red-400 text-sm font-mono">{result.error}</div>
          ) : (
            <div className="overflow-x-auto">
              {Array.isArray(result.data) && result.data.length > 0 ? (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-dark-700/30 text-left text-dark-400 text-sm">
                      {Object.keys(result.data[0] as Record<string, unknown>).map((key) => (
                        <th key={key} className="p-3 font-medium whitespace-nowrap">{key}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(result.data as Record<string, unknown>[]).map((row, i) => (
                      <tr key={i} className="border-b border-dark-700/20 hover:bg-dark-700/20">
                        {Object.values(row).map((val, j) => (
                          <td key={j} className="p-3 text-dark-200 text-sm font-mono whitespace-nowrap">{String(val ?? "NULL")}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-4 text-dark-400 text-sm">{result.isWrite ? "✅ Query berhasil dieksekusi" : "✅ Query selesai (0 rows)"}</div>
              )}
            </div>
          )}
        </div>
      )}

      {history.length > 0 && (
        <div className="bg-dark-800/50 border border-dark-700/30 rounded-2xl p-4">
          <h3 className="text-dark-400 text-sm font-medium mb-2">Riwayat</h3>
          <div className="space-y-1">
            {history.map((h, i) => (
              <button key={i} onClick={() => setQuery(h)}
                className="block w-full text-left px-3 py-1.5 rounded-lg text-dark-400 text-xs font-mono hover:bg-dark-700/50 hover:text-dark-200 transition-all truncate"
              >
                {h}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

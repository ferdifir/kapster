"use client";

import { useState, useEffect, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  openTodayQueue,
  setQueueOpen,
  addQueueCustomer,
  setEntryStatus,
} from "@/app/dashboard/queue/actions";

type QueueData = { id: string; is_open: boolean; total_served: number } | null;

type Entry = {
  id: string;
  number: number;
  customer_name: string;
  phone: string | null;
  status: "waiting" | "called" | "serving" | "done" | "skip";
  barber_id: string | null;
  service_id: string | null;
  joined_at: string;
  called_at: string | null;
  serving_at: string | null;
  done_at: string | null;
};

type Barber = { id: string; display_name: string };
type Service = { id: string; name: string; price: number; duration_min: number };

interface Props {
  barbershop: { id: string; name: string; slug: string };
  queue: QueueData;
  initialEntries: Entry[];
  barbers: Barber[];
  services: Service[];
  maxPerDay: number;
}

const STATUS_LABEL: Record<Entry["status"], string> = {
  waiting: "Menunggu",
  called: "Dipanggil",
  serving: "Dilayani",
  done: "Selesai",
  skip: "Skip",
};

const STATUS_COLOR: Record<Entry["status"], string> = {
  waiting: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  called: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  serving: "bg-green-500/10 text-green-400 border-green-500/20",
  done: "bg-dark-700/50 text-dark-500 border-dark-700/30",
  skip: "bg-red-500/10 text-red-400 border-red-500/20",
};

export default function QueueDashboard({
  barbershop,
  queue: initialQueue,
  initialEntries,
  barbers,
  services,
  maxPerDay,
}: Props) {
  const [queue, setQueue] = useState<QueueData>(initialQueue);
  const [entries, setEntries] = useState<Entry[]>(initialEntries);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    customer_name: "",
    phone: "",
    barber_id: "",
    service_id: "",
  });

  useEffect(() => {
    if (!queue?.id) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`queue-${queue.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "queue_entries",
          filter: `queue_id=eq.${queue.id}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setEntries((prev) =>
              [...prev, payload.new as Entry].sort(
                (a, b) => a.number - b.number
              )
            );
          } else if (payload.eventType === "UPDATE") {
            setEntries((prev) =>
              prev.map((e) =>
                e.id === (payload.new as Entry).id
                  ? { ...e, ...(payload.new as Entry) }
                  : e
              )
            );
          } else if (payload.eventType === "DELETE") {
            setEntries((prev) =>
              prev.filter((e) => e.id !== (payload.old as { id: string }).id)
            );
          }
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queue?.id]);

  const handleOpenQueue = () => {
    setError("");
    startTransition(async () => {
      const result = await openTodayQueue(barbershop.id);
      if ("error" in result && result.error) {
        setError(result.error);
        return;
      }
      if ("data" in result && result.data) setQueue(result.data);
    });
  };

  const handleToggleQueue = () => {
    if (!queue) return;
    setError("");
    startTransition(async () => {
      const result = await setQueueOpen(queue.id, !queue.is_open);
      if (result.error) {
        setError(result.error);
        return;
      }
      setQueue((q) => (q ? { ...q, is_open: !q.is_open } : q));
    });
  };

  const handleAddCustomer = () => {
    if (!queue || !form.customer_name.trim()) return;
    setError("");
    startTransition(async () => {
      const result = await addQueueCustomer(queue.id, maxPerDay, {
        customer_name: form.customer_name,
        phone: form.phone || undefined,
        barber_id: form.barber_id || undefined,
        service_id: form.service_id || undefined,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      setForm({ customer_name: "", phone: "", barber_id: "", service_id: "" });
      setShowAddForm(false);
    });
  };

  const handleStatusChange = (
    entryId: string,
    status: "called" | "serving" | "done" | "skip"
  ) => {
    setError("");
    startTransition(async () => {
      const result = await setEntryStatus(entryId, status, queue?.id);
      if (result.error) setError(result.error);
      if (status === "done") {
        setQueue((q) =>
          q ? { ...q, total_served: q.total_served + 1 } : q
        );
      }
    });
  };

  const stats = {
    waiting: entries.filter((e) => e.status === "waiting").length,
    called: entries.filter((e) => e.status === "called").length,
    serving: entries.filter((e) => e.status === "serving").length,
  };
  const activeEntries = entries.filter(
    (e) => !["done", "skip"].includes(e.status)
  );
  const finishedEntries = entries.filter((e) =>
    ["done", "skip"].includes(e.status)
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">
            Antrian
          </h1>
          <p className="text-dark-400 text-sm">
            {new Date().toLocaleDateString("id-ID", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>

        {queue ? (
          <div className="flex items-center gap-3">
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium border ${
                queue.is_open
                  ? "bg-green-500/10 text-green-400 border-green-500/20"
                  : "bg-dark-700/50 text-dark-400 border-dark-700/30"
              }`}
            >
              {queue.is_open ? "Buka" : "Tutup"}
            </span>
            <button
              onClick={handleToggleQueue}
              disabled={isPending}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 ${
                queue.is_open
                  ? "bg-dark-700 text-dark-200 hover:bg-dark-600"
                  : "gold-gradient text-dark-900"
              }`}
            >
              {queue.is_open ? "Tutup Antrian" : "Buka Antrian"}
            </button>
          </div>
        ) : (
          <button
            onClick={handleOpenQueue}
            disabled={isPending}
            className="px-5 py-2.5 rounded-xl gold-gradient text-dark-900 font-bold text-sm disabled:opacity-50"
          >
            {isPending ? "Membuka..." : "Buka Antrian Hari Ini"}
          </button>
        )}
      </div>

      {error && (
        <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Stats */}
      {queue && (
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Menunggu", value: stats.waiting, color: "text-blue-400" },
            {
              label: "Dipanggil",
              value: stats.called,
              color: "text-yellow-400",
            },
            {
              label: "Dilayani",
              value: stats.serving,
              color: "text-green-400",
            },
            {
              label: "Selesai",
              value: queue.total_served,
              color: "text-dark-400",
            },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-dark-800/50 border border-dark-700/30 rounded-xl p-4 text-center"
            >
              <p className={`font-display text-2xl font-bold ${s.color}`}>
                {s.value}
              </p>
              <p className="text-dark-500 text-xs mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Add Customer */}
      {queue?.is_open && (
        <div className="bg-dark-800/50 border border-dark-700/30 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white text-sm">
              Tambah Pelanggan
            </h2>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-barber-400 border border-barber-400/30 hover:bg-barber-400/10 transition-colors"
            >
              {showAddForm ? "Tutup" : "+ Tambah"}
            </button>
          </div>

          {showAddForm && (
            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-dark-400 text-xs mb-1.5">
                    Nama Pelanggan <span className="text-barber-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.customer_name}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        customer_name: e.target.value,
                      }))
                    }
                    placeholder="John Doe"
                    className="w-full px-3 py-2.5 rounded-xl bg-dark-700/50 border border-dark-600/50 text-white placeholder-dark-500 text-sm focus:outline-none focus:border-barber-400/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-dark-400 text-xs mb-1.5">
                    No. HP
                  </label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, phone: e.target.value }))
                    }
                    placeholder="08xxxxxxxxxx"
                    className="w-full px-3 py-2.5 rounded-xl bg-dark-700/50 border border-dark-600/50 text-white placeholder-dark-500 text-sm focus:outline-none focus:border-barber-400/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-dark-400 text-xs mb-1.5">
                    Layanan
                  </label>
                  <select
                    value={form.service_id}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, service_id: e.target.value }))
                    }
                    className="w-full px-3 py-2.5 rounded-xl bg-dark-700/50 border border-dark-600/50 text-white text-sm focus:outline-none focus:border-barber-400/50 transition-colors"
                  >
                    <option value="">Pilih layanan...</option>
                    {services.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} — Rp{s.price.toLocaleString("id-ID")}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-dark-400 text-xs mb-1.5">
                    Barber
                  </label>
                  <select
                    value={form.barber_id}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, barber_id: e.target.value }))
                    }
                    className="w-full px-3 py-2.5 rounded-xl bg-dark-700/50 border border-dark-600/50 text-white text-sm focus:outline-none focus:border-barber-400/50 transition-colors"
                  >
                    <option value="">Barber manapun</option>
                    {barbers.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.display_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <button
                onClick={handleAddCustomer}
                disabled={isPending || !form.customer_name.trim()}
                className="px-5 py-2.5 rounded-xl gold-gradient text-dark-900 font-bold text-sm disabled:opacity-50 transition-all"
              >
                {isPending ? "Menambahkan..." : "Tambah ke Antrian"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Queue list */}
      {queue && (
        <div className="space-y-4">
          {activeEntries.length > 0 ? (
            <div className="bg-dark-800/50 border border-dark-700/30 rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-dark-700/30">
                <h2 className="font-semibold text-white text-sm">
                  Antrian Aktif
                </h2>
              </div>
              <div className="divide-y divide-dark-700/30">
                {activeEntries.map((entry) => (
                  <EntryRow
                    key={entry.id}
                    entry={entry}
                    barbers={barbers}
                    services={services}
                    onStatusChange={handleStatusChange}
                    isPending={isPending}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-dark-800/50 border border-dark-700/30 rounded-2xl p-10 text-center">
              <p className="text-dark-400 text-sm">Antrian kosong</p>
              {queue.is_open && (
                <p className="text-dark-600 text-xs mt-1">
                  Tambahkan pelanggan di atas
                </p>
              )}
            </div>
          )}

          {finishedEntries.length > 0 && (
            <div className="bg-dark-800/50 border border-dark-700/30 rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-dark-700/30">
                <h2 className="font-semibold text-dark-400 text-sm">
                  Selesai Hari Ini
                </h2>
              </div>
              <div className="divide-y divide-dark-700/30">
                {finishedEntries.map((entry) => (
                  <EntryRow
                    key={entry.id}
                    entry={entry}
                    barbers={barbers}
                    services={services}
                    onStatusChange={handleStatusChange}
                    isPending={isPending}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function EntryRow({
  entry,
  barbers,
  services,
  onStatusChange,
  isPending,
}: {
  entry: Entry;
  barbers: Barber[];
  services: Service[];
  onStatusChange: (
    id: string,
    status: "called" | "serving" | "done" | "skip"
  ) => void;
  isPending: boolean;
}) {
  const barber = barbers.find((b) => b.id === entry.barber_id);
  const service = services.find((s) => s.id === entry.service_id);

  return (
    <div className="flex items-center gap-4 px-5 py-4">
      <div className="w-10 h-10 rounded-xl bg-barber-400/10 border border-barber-400/20 flex items-center justify-center shrink-0">
        <span className="font-display font-bold text-barber-400 text-sm">
          {String(entry.number).padStart(2, "0")}
        </span>
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-white font-medium text-sm truncate">
          {entry.customer_name}
        </p>
        <p className="text-dark-500 text-xs mt-0.5 truncate">
          {[
            entry.phone,
            service?.name,
            barber ? `→ ${barber.display_name}` : null,
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </div>

      <span
        className={`px-2.5 py-1 rounded-lg text-xs font-medium border shrink-0 ${STATUS_COLOR[entry.status]}`}
      >
        {STATUS_LABEL[entry.status]}
      </span>

      <div className="flex items-center gap-2 shrink-0">
        {entry.status === "waiting" && (
          <>
            <button
              onClick={() => onStatusChange(entry.id, "called")}
              disabled={isPending}
              className="px-3 py-1.5 rounded-lg bg-barber-400/10 text-barber-400 text-xs font-medium hover:bg-barber-400/20 transition-colors disabled:opacity-50"
            >
              Panggil
            </button>
            <button
              onClick={() => onStatusChange(entry.id, "skip")}
              disabled={isPending}
              className="px-3 py-1.5 rounded-lg bg-dark-700/50 text-dark-400 text-xs hover:bg-dark-700 transition-colors disabled:opacity-50"
            >
              Skip
            </button>
          </>
        )}
        {entry.status === "called" && (
          <>
            <button
              onClick={() => onStatusChange(entry.id, "serving")}
              disabled={isPending}
              className="px-3 py-1.5 rounded-lg bg-green-500/10 text-green-400 text-xs font-medium hover:bg-green-500/20 transition-colors disabled:opacity-50"
            >
              Layani
            </button>
            <button
              onClick={() => onStatusChange(entry.id, "skip")}
              disabled={isPending}
              className="px-3 py-1.5 rounded-lg bg-dark-700/50 text-dark-400 text-xs hover:bg-dark-700 transition-colors disabled:opacity-50"
            >
              Skip
            </button>
          </>
        )}
        {entry.status === "serving" && (
          <button
            onClick={() => onStatusChange(entry.id, "done")}
            disabled={isPending}
            className="px-3 py-1.5 rounded-lg bg-green-500/20 text-green-300 text-xs font-medium hover:bg-green-500/30 transition-colors disabled:opacity-50"
          >
            Selesai
          </button>
        )}
      </div>
    </div>
  );
}

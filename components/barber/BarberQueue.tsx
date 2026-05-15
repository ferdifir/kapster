"use client";

import { useState, useEffect, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { setBarberEntryStatus } from "@/app/barber/actions";

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
};

interface Props {
  barber: { id: string; display_name: string; barbershop_id: string };
  barbershop: { id: string; name: string };
  queue: { id: string; is_open: boolean; total_served: number } | null;
  initialEntries: Entry[];
  services: { id: string; name: string }[];
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
  called: "bg-barber-400/10 text-barber-400 border-barber-400/20",
  serving: "bg-green-500/10 text-green-400 border-green-500/20",
  done: "bg-dark-700/50 text-dark-500 border-dark-700/30",
  skip: "bg-red-500/10 text-red-400 border-red-500/20",
};

export default function BarberQueue({
  barber,
  barbershop,
  queue,
  initialEntries,
  services,
}: Props) {
  const [entries, setEntries] = useState<Entry[]>(initialEntries);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  useEffect(() => {
    if (!queue?.id) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`barber-queue-${queue.id}`)
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
          }
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queue?.id]);

  const handleStatus = (
    entryId: string,
    status: "called" | "serving" | "done" | "skip"
  ) => {
    setError("");
    startTransition(async () => {
      const result = await setBarberEntryStatus(entryId, status, queue?.id);
      if (result.error) setError(result.error);
    });
  };

  // Show all entries; barbers see everything in their barbershop
  const activeEntries = entries.filter(
    (e) => !["done", "skip"].includes(e.status)
  );

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="font-display text-xl font-bold text-white">
          {barber.display_name}
        </h1>
        <p className="text-dark-400 text-sm">{barbershop.name}</p>
        {queue && (
          <p className="text-dark-500 text-xs mt-0.5">
            {queue.total_served} selesai hari ini
          </p>
        )}
      </div>

      {error && (
        <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      {!queue || !queue.is_open ? (
        <div className="bg-dark-800/50 border border-dark-700/30 rounded-2xl p-8 text-center">
          <p className="text-dark-400 text-sm">Antrian belum dibuka hari ini</p>
        </div>
      ) : activeEntries.length === 0 ? (
        <div className="bg-dark-800/50 border border-dark-700/30 rounded-2xl p-8 text-center">
          <p className="text-dark-400 text-sm">Tidak ada antrian aktif</p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-dark-500 text-xs font-medium uppercase tracking-wider">
            {activeEntries.length} antrian aktif
          </p>
          {activeEntries.map((entry) => {
            const service = services.find((s) => s.id === entry.service_id);
            return (
              <div
                key={entry.id}
                className="bg-dark-800/50 border border-dark-700/30 rounded-xl p-4 space-y-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-barber-400/10 border border-barber-400/20 flex items-center justify-center shrink-0">
                    <span className="font-display font-bold text-barber-400 text-sm">
                      {String(entry.number).padStart(2, "0")}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium text-sm">
                      {entry.customer_name}
                    </p>
                    <p className="text-dark-500 text-xs mt-0.5">
                      {[entry.phone, service?.name].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-lg text-xs font-medium border ${STATUS_COLOR[entry.status]}`}
                  >
                    {STATUS_LABEL[entry.status]}
                  </span>
                </div>

                <div className="flex gap-2">
                  {entry.status === "waiting" && (
                    <>
                      <button
                        onClick={() => handleStatus(entry.id, "called")}
                        disabled={isPending}
                        className="flex-1 py-2.5 rounded-xl bg-barber-400/10 text-barber-400 text-sm font-semibold border border-barber-400/20 hover:bg-barber-400/20 transition-colors disabled:opacity-50"
                      >
                        Panggil
                      </button>
                      <button
                        onClick={() => handleStatus(entry.id, "skip")}
                        disabled={isPending}
                        className="px-4 py-2.5 rounded-xl bg-dark-700/50 text-dark-400 text-sm hover:bg-dark-700 transition-colors disabled:opacity-50"
                      >
                        Skip
                      </button>
                    </>
                  )}
                  {entry.status === "called" && (
                    <button
                      onClick={() => handleStatus(entry.id, "serving")}
                      disabled={isPending}
                      className="flex-1 py-2.5 rounded-xl bg-green-500/10 text-green-400 text-sm font-semibold border border-green-500/20 hover:bg-green-500/20 transition-colors disabled:opacity-50"
                    >
                      Mulai Layani
                    </button>
                  )}
                  {entry.status === "serving" && (
                    <button
                      onClick={() => handleStatus(entry.id, "done")}
                      disabled={isPending}
                      className="flex-1 py-2.5 rounded-xl gold-gradient text-dark-900 text-sm font-bold disabled:opacity-50"
                    >
                      Selesai
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

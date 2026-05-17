"use client";

import { use, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Entry = {
  id: string;
  number: number;
  customer_name: string;
  status: "waiting" | "called" | "serving" | "done" | "skip";
};

type Queue = {
  id: string;
  is_open: boolean;
  total_served: number;
  barbershops: { name: string; logo_url: string | null } | null;
};

export default function DisplayPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const [queue, setQueue] = useState<Queue | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const tick = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    const supabase = createClient();

    async function fetchData() {
      const today = new Date().toISOString().split("T")[0];

      const { data: barbershop } = await supabase
        .from("barbershops")
        .select("id, name, logo_url")
        .eq("slug", slug)
        .eq("is_active", true)
        .single();

      if (!barbershop) {
        setLoading(false);
        return;
      }

      const { data: q } = await supabase
        .from("queues")
        .select("id, is_open, total_served")
        .eq("barbershop_id", barbershop.id)
        .eq("date", today)
        .maybeSingle();

      const queueWithName = q
        ? { ...q, barbershops: { name: barbershop.name, logo_url: barbershop.logo_url } }
        : null;
      setQueue(queueWithName);

      if (q?.id) {
        const { data: e } = await supabase
          .from("queue_entries")
          .select("id, number, customer_name, status")
          .eq("queue_id", q.id)
          .in("status", ["called", "serving"])
          .order("number");
        setEntries((e as Entry[]) ?? []);

        const channel = supabase
          .channel(`display-${q.id}`)
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "queue_entries",
              filter: `queue_id=eq.${q.id}`,
            },
            () => fetchData()
          )
          .subscribe();

        setLoading(false);
        return () => {
          supabase.removeChannel(channel);
        };
      }

      setLoading(false);
    }

    fetchData();
  }, [slug]);

  const barbershopName = queue?.barbershops?.name ?? slug;
  const serving = entries.filter((e) => e.status === "serving");
  const called = entries.filter((e) => e.status === "called");

  return (
    <div className="min-h-screen bg-dark-950 flex flex-col">
      {/* Header */}
      <div className="bg-dark-900 border-b border-dark-800/50 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {queue?.barbershops?.logo_url ? (
            <img
              src={queue.barbershops.logo_url}
              alt="Logo"
              className="w-10 h-10 rounded-lg object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-lg gold-gradient flex items-center justify-center">
              <span className="font-display text-sm font-bold text-dark-900">
                {barbershopName[0]}
              </span>
            </div>
          )}
          <span className="font-display text-xl font-bold text-white">
            {barbershopName}
          </span>
        </div>
        <div className="text-right">
          <p className="text-white font-semibold">{barbershopName}</p>
          <p className="text-dark-400 text-sm">
            {now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-dark-400">Memuat...</p>
        </div>
      ) : !queue || !queue.is_open ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="font-display text-4xl font-bold text-dark-600 mb-3">TUTUP</p>
            <p className="text-dark-500">Antrian belum dibuka hari ini</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center gap-12 p-8">
          {/* Currently serving */}
          <div className="text-center">
            <p className="text-dark-400 text-lg mb-4 uppercase tracking-widest font-medium">
              Sedang Dilayani
            </p>
            {serving.length === 0 ? (
              <p className="font-display text-8xl font-bold text-dark-700">—</p>
            ) : (
              <div className="flex gap-6 flex-wrap justify-center">
                {serving.map((e) => (
                  <div
                    key={e.id}
                    className="bg-dark-800/50 border-2 border-barber-400/40 rounded-3xl px-12 py-8"
                  >
                    <p className="font-display text-9xl font-bold text-barber-400 leading-none">
                      {String(e.number).padStart(2, "0")}
                    </p>
                    <p className="text-dark-300 text-center mt-3 text-lg">{e.customer_name}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Called / next */}
          {called.length > 0 && (
            <div className="text-center">
              <p className="text-dark-500 text-sm mb-3 uppercase tracking-widest">
                Dipanggil Berikutnya
              </p>
              <div className="flex gap-4 flex-wrap justify-center">
                {called.map((e) => (
                  <div
                    key={e.id}
                    className="bg-dark-800/30 border border-dark-600/30 rounded-2xl px-8 py-5"
                  >
                    <p className="font-display text-5xl font-bold text-dark-300">
                      {String(e.number).padStart(2, "0")}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer stat */}
          <p className="text-dark-600 text-sm">
            {queue.total_served} pelanggan selesai hari ini
          </p>
        </div>
      )}
    </div>
  );
}

"use client";

import { use, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

type Entry = {
  id: string;
  number: number;
  customer_name: string;
  status: "waiting" | "called" | "serving" | "done" | "skip";
  queue_id: string;
};

const STATUS_INFO = {
  waiting: {
    label: "Menunggu Giliran",
    color: "text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/20",
  },
  called: {
    label: "Giliran Anda!",
    color: "text-barber-400",
    bg: "bg-barber-400/10 border-barber-400/20",
  },
  serving: {
    label: "Sedang Dilayani",
    color: "text-green-400",
    bg: "bg-green-500/10 border-green-500/20",
  },
  done: {
    label: "Selesai",
    color: "text-dark-400",
    bg: "bg-dark-700/50 border-dark-700/30",
  },
  skip: {
    label: "Dilewati",
    color: "text-dark-400",
    bg: "bg-dark-700/50 border-dark-700/30",
  },
} as const;

export default function StatusPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = use(params);
  const [entry, setEntry] = useState<Entry | null>(null);
  const [waitingBefore, setWaitingBefore] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    let channelCleanup: (() => void) | null = null;

    async function fetchData() {
      const { data } = await supabase
        .from("queue_entries")
        .select("id, number, customer_name, status, queue_id")
        .eq("id", id)
        .single();

      if (!data) {
        setLoading(false);
        return;
      }

      setEntry(data as Entry);

      const { count } = await supabase
        .from("queue_entries")
        .select("id", { count: "exact", head: true })
        .eq("queue_id", data.queue_id)
        .lt("number", data.number)
        .in("status", ["waiting", "called", "serving"]);

      setWaitingBefore(count ?? 0);
      setLoading(false);

      // Subscribe for updates to this queue
      const channel = supabase
        .channel(`status-${id}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "queue_entries",
            filter: `queue_id=eq.${data.queue_id}`,
          },
          () => {
            fetchData();
          }
        )
        .subscribe();

      channelCleanup = () => supabase.removeChannel(channel);
    }

    fetchData();

    return () => {
      if (channelCleanup) channelCleanup();
    };
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="text-dark-400 text-sm">Memuat...</div>
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-dark-300 mb-4">Antrian tidak ditemukan</p>
          <Link href={`/q/${slug}`} className="text-barber-400 text-sm">
            ← Kembali
          </Link>
        </div>
      </div>
    );
  }

  const info = STATUS_INFO[entry.status];

  return (
    <div className="min-h-screen bg-dark-950">
      <div className="bg-dark-900/80 border-b border-dark-800/50 px-4 py-4 text-center">
        <span className="font-display text-sm font-bold text-white">
          Queue<span className="text-barber-400">Barber</span>
        </span>
      </div>

      <div className="max-w-sm mx-auto px-4 py-12 space-y-8 text-center">
        {/* Number */}
        <div>
          <p className="text-dark-500 text-sm mb-3">Nomor Antrian Anda</p>
          <div className="font-display text-8xl font-bold text-barber-400 leading-none">
            {String(entry.number).padStart(2, "0")}
          </div>
          <p className="text-dark-300 mt-3 text-sm">{entry.customer_name}</p>
        </div>

        {/* Status */}
        <div className={`p-6 rounded-2xl border ${info.bg}`}>
          <p className={`font-display text-xl font-bold ${info.color}`}>
            {info.label}
          </p>
          {entry.status === "waiting" && (
            <p className="text-dark-400 text-sm mt-2">
              {waitingBefore > 0
                ? `${waitingBefore} orang di depan Anda · ~${waitingBefore * 20} menit`
                : "Anda berikutnya!"}
            </p>
          )}
          {entry.status === "called" && (
            <p className="text-dark-400 text-sm mt-2">
              Silakan menuju kursi barber
            </p>
          )}
          {entry.status === "serving" && (
            <p className="text-dark-400 text-sm mt-2">Nikmati layanannya!</p>
          )}
          {entry.status === "done" && (
            <p className="text-dark-400 text-sm mt-2">
              Terima kasih sudah berkunjung!
            </p>
          )}
          {entry.status === "skip" && (
            <p className="text-dark-400 text-sm mt-2">
              Nomor antrian Anda telah dilewati
            </p>
          )}
        </div>

        <Link
          href={`/q/${slug}`}
          className="inline-block text-dark-500 text-sm hover:text-dark-300 transition-colors"
        >
          ← Halaman Antrian
        </Link>
      </div>
    </div>
  );
}

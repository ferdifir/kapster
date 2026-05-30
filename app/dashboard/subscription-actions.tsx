"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SubscriptionActions({
  barbershopId,
  periodEnd,
}: {
  barbershopId: string;
  periodEnd: string;
}) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleCancel = async () => {
    setLoading(true);
    const now = new Date().toISOString();

    const { error } = await supabase
      .from("subscriptions")
      .update({ status: "cancelled", updated_at: now })
      .eq("barbershop_id", barbershopId);

    if (!error) {
      setShowConfirm(false);
      router.refresh();
    }
    setLoading(false);
  };

  if (showConfirm) {
    return (
      <div className="text-right">
        <p className="text-dark-300 text-sm mb-2">
          Langganan tetap aktif sampai{" "}
          {new Date(periodEnd).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
          . Setelah itu tidak bisa akses dashboard.
        </p>
        <div className="flex gap-2 justify-end">
          <button
            onClick={() => setShowConfirm(false)}
            className="px-4 py-2 rounded-lg bg-dark-700 text-dark-200 text-sm"
          >
            Batal
          </button>
          <button
            onClick={handleCancel}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-red-500/10 text-red-400 text-sm font-medium hover:bg-red-500/20 transition-colors disabled:opacity-50"
          >
            {loading ? "Memproses..." : "Ya, Cancel"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      className="px-4 py-2 rounded-lg bg-red-500/10 text-red-400 text-sm font-medium hover:bg-red-500/20 transition-colors"
    >
      Cancel Langganan
    </button>
  );
}

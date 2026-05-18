"use client";

import { useState, useTransition } from "react";
import { updateBookingStatus } from "@/app/dashboard/bookings/actions";

type Booking = {
  id: string;
  customer_name: string;
  phone: string;
  scheduled_at: string;
  status: "pending" | "confirmed" | "cancelled" | "done";
  notes: string | null;
  barber_id: string | null;
  service_id: string | null;
  created_at: string;
};

const STATUS_LABEL: Record<Booking["status"], string> = {
  pending: "Menunggu",
  confirmed: "Dikonfirmasi",
  cancelled: "Dibatalkan",
  done: "Selesai",
};

const STATUS_COLOR: Record<Booking["status"], string> = {
  pending: "bg-barber-400/10 text-barber-400 border-barber-400/20",
  confirmed: "bg-green-500/10 text-green-400 border-green-500/20",
  cancelled: "bg-red-500/10 text-red-400 border-red-500/20",
  done: "bg-dark-700/50 text-dark-500 border-dark-700/30",
};

interface Props {
  bookings: Booking[];
  barbers: { id: string; display_name: string }[];
  services: { id: string; name: string }[];
}

export default function BookingsManager({ bookings: initial, barbers, services }: Props) {
  const [bookings, setBookings] = useState<Booking[]>(initial);
  const [filter, setFilter] = useState<"all" | Booking["status"]>("all");
  const [isPending, startTransition] = useTransition();

  const handleStatus = (bookingId: string, status: "confirmed" | "cancelled" | "done") => {
    startTransition(async () => {
      const result = await updateBookingStatus(bookingId, status);
      if (!result.error) {
        setBookings((prev) =>
          prev.map((b) => (b.id === bookingId ? { ...b, status } : b))
        );
      }
    });
  };

  const filtered =
    filter === "all" ? bookings : bookings.filter((b) => b.status === filter);

  const counts = bookings.reduce(
    (acc, b) => ({ ...acc, [b.status]: (acc[b.status] ?? 0) + 1 }),
    {} as Record<string, number>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-white mb-1">Booking</h1>
        <p className="text-dark-400 text-sm">{bookings.length} reservasi total</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {(["all", "pending", "confirmed", "cancelled", "done"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              filter === s
                ? "bg-barber-400/20 text-barber-400 border border-barber-400/30"
                : "bg-dark-800/50 text-dark-400 border border-dark-700/30 hover:text-white"
            }`}
          >
            {s === "all" ? "Semua" : STATUS_LABEL[s]}
            {s !== "all" && counts[s] ? (
              <span className="ml-1.5 text-xs opacity-70">{counts[s]}</span>
            ) : null}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-dark-800/50 border border-dark-700/30 rounded-2xl p-12 text-center">
          <p className="text-dark-400">Tidak ada booking ditemukan</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((booking) => {
            const barber = barbers.find((b) => b.id === booking.barber_id);
            const service = services.find((s) => s.id === booking.service_id);
            const dt = new Date(booking.scheduled_at);

            return (
              <div
                key={booking.id}
                className="bg-dark-800/50 border border-dark-700/30 rounded-xl p-4 space-y-3"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-white font-medium text-sm">{booking.customer_name}</p>
                      <span
                        className={`px-2 py-0.5 rounded-lg text-xs font-medium border ${STATUS_COLOR[booking.status]}`}
                      >
                        {STATUS_LABEL[booking.status]}
                      </span>
                    </div>
                    <p className="text-dark-400 text-xs mt-0.5">
                      {booking.phone}
                      {barber && ` · ${barber.display_name}`}
                      {service && ` · ${service.name}`}
                    </p>
                    <p className="text-dark-300 text-sm mt-1 font-medium">
                      {dt.toLocaleDateString("id-ID", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}{" "}
                      pukul{" "}
                      {dt.toLocaleTimeString("id-ID", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    {booking.notes && (
                      <p className="text-dark-500 text-xs mt-1 italic">{booking.notes}</p>
                    )}
                  </div>
                </div>

                {booking.status === "pending" && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleStatus(booking.id, "confirmed")}
                      disabled={isPending}
                      className="flex-1 py-2 rounded-xl bg-green-500/10 text-green-400 text-sm font-semibold border border-green-500/20 hover:bg-green-500/20 transition-colors disabled:opacity-50"
                    >
                      Konfirmasi
                    </button>
                    <button
                      onClick={() => handleStatus(booking.id, "cancelled")}
                      disabled={isPending}
                      className="flex-1 py-2 rounded-xl bg-red-500/10 text-red-400 text-sm border border-red-500/20 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                    >
                      Batalkan
                    </button>
                  </div>
                )}
                {booking.status === "confirmed" && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleStatus(booking.id, "done")}
                      disabled={isPending}
                      className="flex-1 py-2 rounded-xl gold-gradient text-dark-900 text-sm font-bold disabled:opacity-50"
                    >
                      Tandai Selesai
                    </button>
                    <button
                      onClick={() => handleStatus(booking.id, "cancelled")}
                      disabled={isPending}
                      className="px-4 py-2 rounded-xl bg-dark-700/50 text-dark-400 text-sm hover:bg-dark-700 transition-colors disabled:opacity-50"
                    >
                      Batalkan
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

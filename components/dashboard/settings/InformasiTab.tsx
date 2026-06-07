"use client";

import { useState, useTransition } from "react";
import { updateBarbershopSettings, updateBookingMaxDays } from "@/app/dashboard/settings/actions";
import QrCodeWithFrame from "./QrCodeWithFrame";

type Barbershop = {
  id: string;
  name: string;
  slug: string;
  address: string | null;
  city: string | null;
  phone: string | null;
  wa_number: string | null;
  latitude: number | null;
  longitude: number | null;
  settings_json: unknown;
  logo_url: string | null;
  cover_image_url: string | null;
  about: string | null;
  wuzapi_user_id: string | null;
  wuzapi_token: string | null;
  wa_connected: boolean;
  wa_phone_number: string | null;
};

export default function InformasiTab({ barbershop }: { barbershop: Barbershop }) {
  const [form, setForm] = useState({
    name: barbershop.name,
    address: barbershop.address ?? "",
    city: barbershop.city ?? "",
    phone: barbershop.phone ?? "",
    wa_number: barbershop.wa_number ?? "",
  });
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const [bookingMaxDays, setBookingMaxDays] = useState(
    String((barbershop.settings_json as Record<string, unknown>)?.booking_max_days ?? 7)
  );
  const [bookingDaysPending, setBookingDaysPending] = useState(false);
  const [bookingDaysSuccess, setBookingDaysSuccess] = useState(false);
  const [bookingDaysError, setBookingDaysError] = useState("");

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setSuccess(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setError("");
    setSuccess(false);
    startTransition(async () => {
      const result = await updateBarbershopSettings(barbershop.id, form);
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(true);
      }
    });
  };

  const handleBookingMaxDaysSave = () => {
    const val = parseInt(bookingMaxDays, 10);
    if (isNaN(val) || val < 1 || val > 365) return;
    setBookingDaysError("");
    setBookingDaysSuccess(false);
    setBookingDaysPending(true);
    updateBookingMaxDays(barbershop.id, val)
      .then((result) => {
        setBookingDaysPending(false);
        if (result.error) {
          setBookingDaysError(result.error);
        } else {
          setBookingDaysSuccess(true);
          setTimeout(() => setBookingDaysSuccess(false), 3000);
        }
      })
      .catch(() => {
        setBookingDaysPending(false);
        setBookingDaysError("Terjadi kesalahan");
      });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="px-4 py-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
          Pengaturan berhasil disimpan
        </div>
      )}

      {/* Informasi Barbershop */}
      <div className="bg-dark-800/50 border border-dark-700/30 rounded-2xl p-6 space-y-4">
        <h2 className="font-semibold text-white">Informasi Barbershop</h2>

        <div className="space-y-3">
          <div>
            <label className="text-dark-400 text-xs mb-1 block">Nama Barbershop *</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={set("name")}
              className="w-full px-4 py-3 rounded-xl bg-dark-700/50 border border-dark-600/50 text-white placeholder-dark-500 text-sm focus:outline-none focus:border-barber-400/50"
            />
          </div>
          <div>
            <label className="text-dark-400 text-xs mb-1 block">Slug (URL)</label>
            <input
              type="text"
              value={barbershop.slug}
              disabled
              className="w-full px-4 py-3 rounded-xl bg-dark-700/30 border border-dark-700/30 text-dark-500 text-sm cursor-not-allowed"
            />
            <p className="text-dark-600 text-xs mt-1">Slug tidak dapat diubah</p>
          </div>
          <div>
            <label className="text-dark-400 text-xs mb-1 block">Alamat</label>
            <input
              type="text"
              placeholder="Jl. Contoh No. 1"
              value={form.address}
              onChange={set("address")}
              className="w-full px-4 py-3 rounded-xl bg-dark-700/50 border border-dark-600/50 text-white placeholder-dark-500 text-sm focus:outline-none focus:border-barber-400/50"
            />
          </div>
          <div>
            <label className="text-dark-400 text-xs mb-1 block">Kota</label>
            <input
              type="text"
              placeholder="Jakarta"
              value={form.city}
              onChange={set("city")}
              className="w-full px-4 py-3 rounded-xl bg-dark-700/50 border border-dark-600/50 text-white placeholder-dark-500 text-sm focus:outline-none focus:border-barber-400/50"
            />
          </div>
        </div>
      </div>

      {/* Kontak */}
      <div className="bg-dark-800/50 border border-dark-700/30 rounded-2xl p-6 space-y-4">
        <h2 className="font-semibold text-white">Kontak</h2>
        <div className="space-y-3">
          <div>
            <label className="text-dark-400 text-xs mb-1 block">No. Telepon</label>
            <input
              type="text"
              placeholder="0812-xxxx-xxxx"
              value={form.phone}
              onChange={set("phone")}
              className="w-full px-4 py-3 rounded-xl bg-dark-700/50 border border-dark-600/50 text-white placeholder-dark-500 text-sm focus:outline-none focus:border-barber-400/50"
            />
          </div>
          <div>
            <label className="text-dark-400 text-xs mb-1 block">No. WhatsApp</label>
            <input
              type="text"
              placeholder="6281xxxxxxxx (format internasional)"
              value={form.wa_number}
              onChange={set("wa_number")}
              className="w-full px-4 py-3 rounded-xl bg-dark-700/50 border border-dark-600/50 text-white placeholder-dark-500 text-sm focus:outline-none focus:border-barber-400/50"
            />
            <p className="text-dark-600 text-xs mt-1">Digunakan untuk notifikasi WhatsApp ke pelanggan</p>
          </div>
        </div>
      </div>

      {/* QR Code */}
      <div className="bg-dark-800/50 border border-dark-700/30 rounded-2xl p-6 space-y-4">
        <h2 className="font-semibold text-white">QR Code Antrian</h2>
        <p className="text-dark-400 text-xs">
          Scan QR code ini untuk langsung masuk ke halaman antrian publik.
        </p>
        <QrCodeWithFrame
          url={`${process.env.NEXT_PUBLIC_BASE_URL || "https://kapster.my.id"}/q/${barbershop.slug}`}
          name={barbershop.name}
        />
      </div>

      {/* Booking Max Days */}
      <div className="bg-dark-800/50 border border-dark-700/30 rounded-2xl p-6 space-y-4">
        <h2 className="font-semibold text-white">Pengaturan Antrian</h2>
        <div className="space-y-3">
          <div>
            <label className="text-dark-400 text-xs mb-1 block">
              Batas Hari Booking ke Depan
            </label>
            <input
              type="number"
              min={1}
              max={365}
              value={bookingMaxDays}
              onChange={(e) => {
                setBookingMaxDays(e.target.value);
                setBookingDaysSuccess(false);
                setBookingDaysError("");
              }}
              className="w-full px-4 py-3 rounded-xl bg-dark-700/50 border border-dark-600/50 text-white placeholder-dark-500 text-sm focus:outline-none focus:border-barber-400/50"
            />
            <p className="text-dark-600 text-xs mt-1">
              Customer bisa booking antrian hingga {bookingMaxDays} hari ke depan. Default: 7 hari.
            </p>
          </div>
          {bookingDaysError && (
            <p className="text-sm text-red-400">{bookingDaysError}</p>
          )}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleBookingMaxDaysSave}
              disabled={bookingDaysPending}
              className="px-5 py-2.5 rounded-xl gold-gradient text-dark-900 font-bold text-sm disabled:opacity-50"
            >
              {bookingDaysPending ? "Menyimpan..." : "Simpan"}
            </button>
            {bookingDaysSuccess && (
              <span className="text-green-400 text-sm">Berhasil disimpan</span>
            )}
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={isPending || !form.name.trim()}
        className="w-full py-3 rounded-xl gold-gradient text-dark-900 font-bold text-sm disabled:opacity-50"
      >
        {isPending ? "Menyimpan..." : "Simpan Pengaturan"}
      </button>
    </form>
  );
}

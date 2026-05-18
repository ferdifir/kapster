"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { updateBarbershopSettings, updateBarbershopLocation, updateBookingMaxDays } from "@/app/dashboard/settings/actions";
import MapPicker from "@/components/MapPicker";
import LogoUploader from "@/components/dashboard/LogoUploader";
import {
  connectWhatsApp,
  getWhatsAppQr,
  checkWhatsAppStatus,
  disconnectWhatsApp,
} from "@/app/dashboard/settings/wa-connect/actions";

import type { Json } from "@/lib/supabase/types";

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
  settings_json: Json;
  logo_url: string | null;
  wuzapi_user_id: number | null;
  wuzapi_token: string | null;
  wa_connected: boolean;
  wa_phone_number: string | null;
};

export default function SettingsForm({ barbershop }: { barbershop: Barbershop }) {
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
  const [locationSaved, setLocationSaved] = useState(false);
  const [locationSaving, setLocationSaving] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [bookingMaxDays, setBookingMaxDays] = useState(
    String((barbershop.settings_json as Record<string, unknown>)?.booking_max_days ?? 7)
  );
  const [bookingDaysPending, setBookingDaysPending] = useState(false);
  const [bookingDaysSuccess, setBookingDaysSuccess] = useState(false);
  const [waDisclaimerAccepted, setWaDisclaimerAccepted] = useState(false);
  const [waConnecting, setWaConnecting] = useState(false);
  const [waQrCode, setWaQrCode] = useState<string | null>(null);
  const [waStatus, setWaStatus] = useState<{
    connected: boolean;
    loggedIn: boolean;
  } | null>(null);
  const [waError, setWaError] = useState("");
  const [waSuccess, setWaSuccess] = useState("");
  const qrPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
    setBookingDaysSuccess(false);
    setBookingDaysPending(true);
    updateBookingMaxDays(barbershop.id, val)
      .then((result) => {
        setBookingDaysPending(false);
        if (result.error) {
          setError(result.error);
        } else {
          setBookingDaysSuccess(true);
          setTimeout(() => setBookingDaysSuccess(false), 3000);
        }
      })
      .catch(() => {
        setBookingDaysPending(false);
        setError("Terjadi kesalahan");
      });
  };

  useEffect(() => {
    if (waQrCode) {
      qrPollRef.current = setInterval(async () => {
        const result = await checkWhatsAppStatus(barbershop.id);
        if (result.loggedIn) {
          setWaQrCode(null);
          setWaStatus({ connected: true, loggedIn: true });
          setWaSuccess("WhatsApp berhasil terhubung!");
          if (qrPollRef.current) clearInterval(qrPollRef.current);
        }
      }, 3000);
    }
    return () => {
      if (qrPollRef.current) clearInterval(qrPollRef.current);
    };
  }, [waQrCode, barbershop.id]);

  const handleWaConnect = async () => {
    setWaError("");
    setWaSuccess("");
    setWaConnecting(true);
    const result = await connectWhatsApp(barbershop.id);
    setWaConnecting(false);
    if (result.error) {
      setWaError(result.error);
      return;
    }
    if (result.needsQr) {
      const qrResult = await getWhatsAppQr(barbershop.id);
      if (qrResult.error) {
        setWaError(qrResult.error);
      } else if (qrResult.qr) {
        setWaQrCode(qrResult.qr);
      }
    } else {
      setWaSuccess("WhatsApp berhasil terhubung!");
      const statusResult = await checkWhatsAppStatus(barbershop.id);
      if (!statusResult.error) {
        setWaStatus({ connected: statusResult.connected ?? false, loggedIn: statusResult.loggedIn ?? false });
      }
    }
  };

  const handleWaDisconnect = async () => {
    setWaError("");
    setWaSuccess("");
    const result = await disconnectWhatsApp(barbershop.id);
    if (result.error) {
      setWaError(result.error);
    } else {
      setWaStatus(null);
      setWaQrCode(null);
      setWaSuccess("WhatsApp berhasil disconnect.");
    }
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

      <div className="bg-dark-800/50 border border-dark-700/30 rounded-2xl p-6 space-y-4">
        <h2 className="font-semibold text-white">Branding</h2>
        <LogoUploader
          barbershopId={barbershop.id}
          currentLogoUrl={barbershop.logo_url}
        />
      </div>

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

      <div className="bg-dark-800/50 border border-dark-700/30 rounded-2xl p-6 space-y-4">
        <h2 className="font-semibold text-white">Lokasi Barbershop</h2>
        <MapPicker
          latitude={barbershop.latitude}
          longitude={barbershop.longitude}
          onLocationChange={(coords) => {
            setLocationError("");
            setLocationSaved(false);
            setLocationSaving(true);
            updateBarbershopLocation(barbershop.id, coords.latitude, coords.longitude).then((result) => {
              setLocationSaving(false);
              if (result.error) {
                setLocationError(result.error);
              } else {
                setLocationSaved(true);
                setTimeout(() => setLocationSaved(false), 3000);
              }
            });
          }}
        />
        {locationSaving && (
          <p className="text-sm text-dark-400">Menyimpan lokasi...</p>
        )}
        {locationError && (
          <p className="text-sm text-red-400">{locationError}</p>
        )}
        {locationSaved && (
          <p className="text-sm text-green-400">Lokasi berhasil disimpan</p>
        )}
      </div>

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
              }}
              className="w-full px-4 py-3 rounded-xl bg-dark-700/50 border border-dark-600/50 text-white placeholder-dark-500 text-sm focus:outline-none focus:border-barber-400/50"
            />
            <p className="text-dark-600 text-xs mt-1">
              Customer bisa booking antrian hingga {bookingMaxDays} hari ke depan. Default: 7 hari.
            </p>
          </div>
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

      {/* WhatsApp Connection Section */}
      <div className="bg-dark-800/50 border border-dark-700/30 rounded-2xl p-6 space-y-4">
        <h2 className="font-semibold text-white">WhatsApp Notification</h2>

        {waError && (
          <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {waError}
          </div>
        )}
        {waSuccess && (
          <div className="px-4 py-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
            {waSuccess}
          </div>
        )}

        {barbershop.wa_connected ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400" />
              <span className="text-green-400 text-sm font-medium">
                Terhubung: {barbershop.wa_phone_number}
              </span>
            </div>
            <button
              type="button"
              onClick={handleWaDisconnect}
              className="px-5 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 font-bold text-sm hover:bg-red-500/20"
            >
              Disconnect WhatsApp
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <p className="text-amber-300 text-sm font-medium mb-2">⚠️ Peringatan</p>
              <p className="text-amber-300/80 text-xs leading-relaxed">
                Fitur ini menggunakan WhatsApp API tidak resmi (unofficial). Resiko pemblokiran
                nomor WhatsApp ditanggung oleh pemilik barbershop. Kami tidak bertanggung jawab
                atas nomor yang diblokir oleh WhatsApp. Gunakan dengan bijak dan hindari
                pengiriman pesan spam.
              </p>
              <label className="flex items-center gap-2 mt-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={waDisclaimerAccepted}
                  onChange={(e) => setWaDisclaimerAccepted(e.target.checked)}
                  className="rounded border-dark-600 bg-dark-700 text-barber-400"
                />
                <span className="text-amber-300/80 text-xs">
                  Saya memahami resiko dan ingin melanjutkan
                </span>
              </label>
            </div>

            {waQrCode && (
              <div className="space-y-3 text-center">
                <p className="text-dark-400 text-sm">
                  Scan QR code ini dengan WhatsApp di HP Anda:
                </p>
                <div className="inline-block p-4 bg-white rounded-xl">
                  <img src={waQrCode} alt="WhatsApp QR Code" className="w-64 h-64" />
                </div>
                <p className="text-dark-500 text-xs">
                  Menunggu scan... (akan otomatis terdeteksi)
                </p>
              </div>
            )}

            {!waQrCode && (
              <button
                type="button"
                onClick={handleWaConnect}
                disabled={waConnecting || !waDisclaimerAccepted}
                className="px-5 py-2.5 rounded-xl gold-gradient text-dark-900 font-bold text-sm disabled:opacity-50"
              >
                {waConnecting ? "Menghubungkan..." : "Connect WhatsApp"}
              </button>
            )}
          </div>
        )}
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

"use client";

import { useState, useEffect, useRef } from "react";
import {
  connectWhatsApp,
  getWhatsAppQr,
  checkWhatsAppStatus,
  disconnectWhatsApp,
} from "@/app/dashboard/settings/wa-connect/actions";

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

export default function WhatsAppTab({ barbershop }: { barbershop: Barbershop }) {
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
  );
}

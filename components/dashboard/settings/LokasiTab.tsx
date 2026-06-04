"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { updateBarbershopLocation } from "@/app/dashboard/settings/actions";

const MapPicker = dynamic(() => import("@/components/MapPicker"), { ssr: false });

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

export default function LokasiTab({ barbershop }: { barbershop: Barbershop }) {
  const [locationSaved, setLocationSaved] = useState(false);
  const [locationSaving, setLocationSaving] = useState(false);
  const [locationError, setLocationError] = useState("");

  return (
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
  );
}

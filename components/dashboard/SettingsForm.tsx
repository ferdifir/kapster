"use client";

import { useState } from "react";
import { User, Info, MapPin, MessageCircle } from "lucide-react";
import ProfilTab from "@/components/dashboard/settings/ProfilTab";
import InformasiTab from "@/components/dashboard/settings/InformasiTab";
import LokasiTab from "@/components/dashboard/settings/LokasiTab";
import WhatsAppTab from "@/components/dashboard/settings/WhatsAppTab";

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

type Tab = "profil" | "informasi" | "lokasi" | "whatsapp";

const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: "profil", label: "Profil", icon: <User size={16} /> },
  { key: "informasi", label: "Informasi", icon: <Info size={16} /> },
  { key: "lokasi", label: "Lokasi", icon: <MapPin size={16} /> },
  { key: "whatsapp", label: "WhatsApp", icon: <MessageCircle size={16} /> },
];

export default function SettingsForm({ barbershop }: { barbershop: Barbershop }) {
  const [activeTab, setActiveTab] = useState<Tab>("profil");

  return (
    <div className="space-y-6">
      <div className="flex gap-1 p-1 bg-dark-800/50 rounded-xl border border-dark-700/30 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.key
                ? "bg-barber-400/10 text-barber-400"
                : "text-dark-400 hover:text-dark-200"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "profil" && <ProfilTab barbershop={barbershop} />}
      {activeTab === "informasi" && <InformasiTab barbershop={barbershop} />}
      {activeTab === "lokasi" && <LokasiTab barbershop={barbershop} />}
      {activeTab === "whatsapp" && <WhatsAppTab barbershop={barbershop} />}
    </div>
  );
}

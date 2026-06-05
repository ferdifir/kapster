"use client";

import { useState } from "react";
import { DEFAULT_TEMPLATES, CUSTOMIZABLE_EVENTS, type WACustomizableEvent } from "@/lib/wa-templates";
import { saveWaTemplates, resetWaTemplates } from "@/app/dashboard/settings/actions";

const EVENT_LABELS: Record<WACustomizableEvent, string> = {
  join_queue: "Join Queue",
  queue_called: "Queue Called",
  queue_serving: "Queue Serving",
  queue_done: "Queue Done",
  queue_number_update: "Queue Number Update",
  booking_confirmed: "Booking Confirmed",
  booking_reminder: "Booking Reminder",
};

const EVENT_DESCRIPTIONS: Record<WACustomizableEvent, string> = {
  join_queue: "Dikirim saat pelanggan daftar antrian",
  queue_called: "Dikirim saat giliran pelanggan sudah dekat",
  queue_serving: "Dikirim saat pelanggan sedang dilayani",
  queue_done: "Dikirim saat pelayanan selesai",
  queue_number_update: "Dikirim saat ada update posisi antrian",
  booking_confirmed: "Dikirim saat booking dikonfirmasi",
  booking_reminder: "Dikirim 1 jam sebelum booking",
};

const PLACEHOLDERS = [
  "{name}", "{barbershop}", "{number}", "{date}", "{time}",
  "{estimated}", "{position}", "{service}", "{barber}",
];

type Barbershop = {
  id: string;
  wa_templates: Record<string, string> | null;
};

export default function WaTemplateTab({ barbershop }: { barbershop: Barbershop }) {
  const [templates, setTemplates] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const ev of CUSTOMIZABLE_EVENTS) {
      initial[ev] = barbershop.wa_templates?.[ev] || DEFAULT_TEMPLATES[ev];
    }
    return initial;
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const hasCustomizations = CUSTOMIZABLE_EVENTS.some(
    (ev) => templates[ev] !== DEFAULT_TEMPLATES[ev]
  );

  const handleSave = async () => {
    setError("");
    setSuccess("");
    setSaving(true);

    const overrides: Record<string, string> = {};
    for (const ev of CUSTOMIZABLE_EVENTS) {
      if (templates[ev] !== DEFAULT_TEMPLATES[ev]) {
        overrides[ev] = templates[ev];
      }
    }

    const result = await saveWaTemplates(barbershop.id, overrides);
    setSaving(false);

    if (result.error) {
      setError(result.error);
    } else {
      setSuccess("Template berhasil disimpan!");
    }
  };

  const handleReset = async () => {
    setError("");
    setSuccess("");

    for (const ev of CUSTOMIZABLE_EVENTS) {
      setTemplates((prev) => ({ ...prev, [ev]: DEFAULT_TEMPLATES[ev] }));
    }

    const result = await resetWaTemplates(barbershop.id);
    if (result.error) {
      setError(result.error);
    } else {
      setSuccess("Template berhasil direset ke default!");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-white">Template Pesan WhatsApp</h2>
          <p className="text-dark-400 text-sm mt-1">
            Kustomisasi pesan yang dikirim ke pelanggan. Biarkan default jika tidak ingin diubah.
          </p>
        </div>
        {hasCustomizations && (
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2 rounded-xl border border-dark-700/30 text-dark-400 text-sm hover:text-red-400 hover:border-red-500/20 transition-colors"
          >
            Reset ke Default
          </button>
        )}
      </div>

      {error && (
        <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="px-4 py-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
          {success}
        </div>
      )}

      <div className="p-4 rounded-xl bg-dark-800/30 border border-dark-700/30">
        <p className="text-dark-400 text-xs mb-2">Placeholder yang tersedia:</p>
        <div className="flex flex-wrap gap-1.5">
          {PLACEHOLDERS.map((p) => (
            <code key={p} className="px-2 py-0.5 rounded-md bg-dark-700 text-barber-400 text-xs font-mono">
              {p}
            </code>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {CUSTOMIZABLE_EVENTS.map((eventType) => (
          <div key={eventType} className="bg-dark-800/50 border border-dark-700/30 rounded-2xl p-4 space-y-3">
            <div>
              <label className="text-sm font-medium text-white">{EVENT_LABELS[eventType]}</label>
              <p className="text-dark-500 text-xs">{EVENT_DESCRIPTIONS[eventType]}</p>
            </div>
            <textarea
              value={templates[eventType]}
              onChange={(e) =>
                setTemplates((prev) => ({ ...prev, [eventType]: e.target.value }))
              }
              rows={3}
              className="w-full px-4 py-3 rounded-xl bg-dark-700/50 border border-dark-600/50 text-white text-sm placeholder-dark-500 resize-none focus:outline-none focus:border-barber-400/50 font-mono"
            />
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="px-6 py-2.5 rounded-xl gold-gradient text-dark-900 font-bold text-sm disabled:opacity-50"
      >
        {saving ? "Menyimpan..." : "Simpan Template"}
      </button>
    </div>
  );
}

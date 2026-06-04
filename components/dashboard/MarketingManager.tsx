"use client";

import { useState, useTransition } from "react";
import type { MarketingLead, MarketingLeadActivity, LeadStats } from "@/lib/marketing-types";
import {
  updateLeadStatus,
  addLeadNote,
  createLead,
  deleteLead,
} from "@/app/dashboard/marketing/actions";

const STATUS_LABELS: Record<string, string> = {
  new: "Baru",
  contacted: "Sudah Dihubungi",
  interested: "Tertarik",
  demo: "Demo",
  customer: "Customer",
  closed: "Tutup",
};

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  contacted: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  interested: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  demo: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  customer: "bg-green-500/20 text-green-400 border-green-500/30",
  closed: "bg-dark-600/50 text-dark-400 border-dark-500/30",
};

const PRIORITY_COLORS: Record<string, string> = {
  HIGH: "bg-red-500/20 text-red-400 border-red-500/30",
  MEDIUM: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  LOW: "bg-dark-600/50 text-dark-400 border-dark-500/30",
};

const TABS = [
  { key: "all", label: "Semua" },
  { key: "new", label: "Baru" },
  { key: "contacted", label: "Dihubungi" },
  { key: "interested", label: "Tertarik" },
  { key: "demo", label: "Demo" },
  { key: "customer", label: "Customer" },
  { key: "closed", label: "Tutup" },
];

const EMPTY_ADD_FORM = {
  name: "",
  contact: "",
  city: "",
  branches: "",
  instagram: "",
  priority: "MEDIUM",
  notes: "",
};

function formatPhone(contact: string): string {
  const digits = contact.replace(/\D/g, "");
  if (digits.startsWith("62")) return digits;
  if (digits.startsWith("0")) return "62" + digits.slice(1);
  return digits;
}

interface Props {
  initialLeads: MarketingLead[];
  initialActivitiesByLead: Record<string, MarketingLeadActivity[]>;
  stats: LeadStats;
}

export default function MarketingManager({
  initialLeads,
  initialActivitiesByLead,
  stats,
}: Props) {
  const [leads, setLeads] = useState<MarketingLead[]>(initialLeads);
  const [activitiesByLead, setActivitiesByLead] = useState<
    Record<string, MarketingLeadActivity[]>
  >(initialActivitiesByLead);
  const [activeTab, setActiveTab] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [noteInputs, setNoteInputs] = useState<Record<string, string>>({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState(EMPTY_ADD_FORM);
  const [isPending, startTransition] = useTransition();

  const filteredLeads =
    activeTab === "all"
      ? leads
      : leads.filter((l) => l.status === activeTab);

  const handleStatusChange = (leadId: string, status: string) => {
    startTransition(async () => {
      await updateLeadStatus(leadId, status);
      setLeads((prev) =>
        prev.map((l) =>
          l.id === leadId
            ? {
                ...l,
                status: status as MarketingLead["status"],
                last_contacted_at:
                  status === "contacted"
                    ? new Date().toISOString()
                    : l.last_contacted_at,
                updated_at: new Date().toISOString(),
              }
            : l
        )
      );
      const activity: MarketingLeadActivity = {
        id: crypto.randomUUID(),
        lead_id: leadId,
        activity_type: "status_change",
        description: `Status berubah: ${STATUS_LABELS[status] || status}`,
        created_at: new Date().toISOString(),
      };
      setActivitiesByLead((prev) => ({
        ...prev,
        [leadId]: [activity, ...(prev[leadId] || [])],
      }));
    });
  };

  const handleAddNote = (leadId: string) => {
    const note = noteInputs[leadId]?.trim();
    if (!note) return;
    startTransition(async () => {
      await addLeadNote(leadId, note);
      setNoteInputs((prev) => ({ ...prev, [leadId]: "" }));
      const activity: MarketingLeadActivity = {
        id: crypto.randomUUID(),
        lead_id: leadId,
        activity_type: "note",
        description: note,
        created_at: new Date().toISOString(),
      };
      setActivitiesByLead((prev) => ({
        ...prev,
        [leadId]: [activity, ...(prev[leadId] || [])],
      }));
    });
  };

  const handleCreateLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.name.trim() || !addForm.contact.trim()) return;
    startTransition(async () => {
      await createLead({
        name: addForm.name.trim(),
        contact: addForm.contact.trim(),
        branches: addForm.branches.trim() || undefined,
        city: addForm.city.trim() || undefined,
        instagram: addForm.instagram.trim() || undefined,
        priority: addForm.priority,
        notes: addForm.notes.trim() || undefined,
      });
      setShowAddModal(false);
      setAddForm(EMPTY_ADD_FORM);
    });
  };

  const handleDelete = (leadId: string) => {
    if (!confirm("Hapus lead ini?")) return;
    startTransition(async () => {
      await deleteLead(leadId);
      setLeads((prev) => prev.filter((l) => l.id !== leadId));
    });
  };

  const toggleExpand = (leadId: string) => {
    setExpandedId((prev) => (prev === leadId ? null : leadId));
  };

  const formatDate = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white mb-1">Marketing</h1>
          <p className="text-dark-400 text-sm">Kelola leads & outreach barbershop</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 rounded-xl bg-barber-400 text-dark-900 font-medium"
        >
          + Tambah Lead
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        {[
          { label: "Total", value: stats.total, key: "total", accent: false },
          { label: "Baru", value: stats.new, key: "new", accent: false },
          { label: "Dihubungi", value: stats.contacted, key: "contacted", accent: false },
          { label: "Tertarik", value: stats.interested, key: "interested", accent: false },
          { label: "Demo", value: stats.demo, key: "demo", accent: false },
          { label: "Customer", value: stats.customer, key: "customer", accent: false },
          { label: "Konversi", value: `${stats.conversion_rate}%`, key: "conversion", accent: true },
        ].map((item) => (
          <div
            key={item.key}
            className={`p-4 rounded-xl border ${
              item.accent
                ? "bg-barber-400/10 border-barber-400/30"
                : "bg-dark-800/50 border-dark-700/30"
            }`}
          >
            <p className="text-2xl font-bold text-white">{item.value}</p>
            <p
              className={`text-xs mt-1 ${
                item.accent ? "text-barber-400" : "text-dark-400"
              }`}
            >
              {item.label}
            </p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
              activeTab === tab.key
                ? "bg-barber-400/10 border-barber-400/30 text-barber-400"
                : "bg-dark-800/50 border-dark-700/30 text-dark-400 hover:text-white"
            }`}
          >
            {tab.label}
            {tab.key !== "all" && (
              <span className="ml-1.5 text-xs opacity-60">
                {stats[tab.key as keyof LeadStats] as number}
              </span>
            )}
          </button>
        ))}
      </div>

      {filteredLeads.length === 0 ? (
        <div className="bg-dark-800/50 border border-dark-700/30 rounded-2xl p-12 text-center">
          <p className="text-dark-400">Belum ada lead di kategori ini</p>
        </div>
      ) : (
        <div className="bg-dark-800/50 border border-dark-700/30 rounded-2xl overflow-hidden">
          <div className="divide-y divide-dark-700/30">
            {filteredLeads.map((lead) => (
              <div key={lead.id}>
                <div
                  onClick={() => toggleExpand(lead.id)}
                  className="flex items-center gap-2 px-4 py-3 cursor-pointer hover:bg-dark-700/30 transition-colors"
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleExpand(lead.id);
                    }}
                    className="p-1 rounded text-dark-500 hover:text-white shrink-0"
                  >
                    <svg
                      className={`w-4 h-4 transition-transform ${
                        expandedId === lead.id ? "rotate-90" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {lead.name}
                    </p>
                  </div>

                  <div className="hidden md:block shrink-0">
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
                        PRIORITY_COLORS[lead.priority]
                      }`}
                    >
                      {lead.priority}
                    </span>
                  </div>

                  <div className="hidden lg:block w-24 shrink-0">
                    <p className="text-xs text-dark-400 truncate">
                      {lead.branches || "-"}
                    </p>
                  </div>

                  <div className="hidden xl:block w-20 shrink-0">
                    <p className="text-xs text-dark-400 truncate">
                      {lead.city || "-"}
                    </p>
                  </div>

                  <div className="shrink-0">
                    <a
                      href={`https://wa.me/${formatPhone(lead.contact)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30 transition-colors"
                    >
                      <svg
                        className="w-3.5 h-3.5"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                      </svg>
                      <span>WA</span>
                    </a>
                  </div>

                  <div className="hidden sm:block shrink-0">
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full border ${STATUS_COLORS[lead.status]}`}
                    >
                      {STATUS_LABELS[lead.status]}
                    </span>
                  </div>

                  <div className="hidden md:block w-24 shrink-0">
                    <p className="text-xs text-dark-400">
                      {lead.last_contacted_at
                        ? formatDate(lead.last_contacted_at)
                        : "-"}
                    </p>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(lead.id);
                    }}
                    disabled={isPending}
                    className="p-1.5 rounded-lg text-dark-500 hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>

                {expandedId === lead.id && (
                  <div className="border-t border-dark-700/30">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
                      <div className="md:col-span-3 flex flex-wrap gap-2 pb-2 border-b border-dark-700/30">
                        {Object.entries(STATUS_LABELS).map(([key, label]) => (
                          <button
                            key={key}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStatusChange(lead.id, key);
                            }}
                            disabled={key === lead.status || isPending}
                            className={`text-xs font-medium px-2.5 py-1 rounded-full border transition-colors disabled:opacity-50 ${
                              key === lead.status
                                ? STATUS_COLORS[key]
                                : "bg-dark-700/50 border-dark-600/50 text-dark-400 hover:text-white"
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>

                      <div className="md:col-span-2 space-y-2">
                        <p className="text-xs font-medium text-dark-400 uppercase tracking-wider">
                          Aktivitas
                        </p>
                        <div className="max-h-60 overflow-y-auto space-y-1">
                          {(activitiesByLead[lead.id] || [])
                            .slice(0, 20)
                            .map((activity) => (
                              <div
                                key={activity.id}
                                className="flex items-start gap-2 text-xs"
                              >
                                <span className="text-dark-600 shrink-0 mt-0.5">
                                  {formatDate(activity.created_at)}
                                </span>
                                <span className="text-dark-300">
                                  {activity.description}
                                </span>
                              </div>
                            ))}
                          {(!activitiesByLead[lead.id] ||
                            activitiesByLead[lead.id].length === 0) && (
                            <p className="text-dark-500 text-xs">
                              Belum ada aktivitas
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <p className="text-xs font-medium text-dark-400 uppercase tracking-wider">
                          Catatan
                        </p>
                        <textarea
                          value={noteInputs[lead.id] || ""}
                          onChange={(e) =>
                            setNoteInputs((prev) => ({
                              ...prev,
                              [lead.id]: e.target.value,
                            }))
                          }
                          placeholder="Tambah catatan..."
                          rows={3}
                          className="w-full bg-dark-800 border border-dark-700/30 rounded-xl px-3 py-2 text-sm text-white placeholder-dark-500 focus:outline-none focus:border-barber-400/50 resize-none"
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddNote(lead.id);
                          }}
                          disabled={isPending || !noteInputs[lead.id]?.trim()}
                          className="w-full px-3 py-1.5 rounded-xl bg-barber-400 text-dark-900 text-xs font-bold disabled:opacity-50"
                        >
                          {isPending ? "Menyimpan..." : "Simpan Catatan"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {showAddModal && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="bg-dark-900 border border-dark-700/50 rounded-2xl p-6 w-full max-w-md space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold text-white">Tambah Lead Baru</h2>
            <form onSubmit={handleCreateLead} className="space-y-3">
              <div>
                <label className="text-dark-400 text-xs mb-1 block">
                  Nama <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={addForm.name}
                  onChange={(e) =>
                    setAddForm((f) => ({ ...f, name: e.target.value }))
                  }
                  className="w-full bg-dark-800 border border-dark-700/30 rounded-xl px-3 py-2 text-sm text-white placeholder-dark-500 focus:outline-none focus:border-barber-400/50"
                  placeholder="Nama lead"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-dark-400 text-xs mb-1 block">
                  Kontak (WA) <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={addForm.contact}
                  onChange={(e) =>
                    setAddForm((f) => ({ ...f, contact: e.target.value }))
                  }
                  className="w-full bg-dark-800 border border-dark-700/30 rounded-xl px-3 py-2 text-sm text-white placeholder-dark-500 focus:outline-none focus:border-barber-400/50"
                  placeholder="08xxxx atau 628xx"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-dark-400 text-xs mb-1 block">
                    Kota
                  </label>
                  <input
                    type="text"
                    value={addForm.city}
                    onChange={(e) =>
                      setAddForm((f) => ({ ...f, city: e.target.value }))
                    }
                    className="w-full bg-dark-800 border border-dark-700/30 rounded-xl px-3 py-2 text-sm text-white placeholder-dark-500 focus:outline-none focus:border-barber-400/50"
                    placeholder="Kota"
                  />
                </div>
                <div>
                  <label className="text-dark-400 text-xs mb-1 block">
                    Cabang
                  </label>
                  <input
                    type="text"
                    value={addForm.branches}
                    onChange={(e) =>
                      setAddForm((f) => ({ ...f, branches: e.target.value }))
                    }
                    className="w-full bg-dark-800 border border-dark-700/30 rounded-xl px-3 py-2 text-sm text-white placeholder-dark-500 focus:outline-none focus:border-barber-400/50"
                    placeholder="Cabang"
                  />
                </div>
              </div>
              <div>
                <label className="text-dark-400 text-xs mb-1 block">
                  Instagram
                </label>
                <input
                  type="text"
                  value={addForm.instagram}
                  onChange={(e) =>
                    setAddForm((f) => ({ ...f, instagram: e.target.value }))
                  }
                  className="w-full bg-dark-800 border border-dark-700/30 rounded-xl px-3 py-2 text-sm text-white placeholder-dark-500 focus:outline-none focus:border-barber-400/50"
                  placeholder="@username"
                />
              </div>
              <div>
                <label className="text-dark-400 text-xs mb-1 block">
                  Prioritas
                </label>
                <select
                  value={addForm.priority}
                  onChange={(e) =>
                    setAddForm((f) => ({ ...f, priority: e.target.value }))
                  }
                  className="w-full bg-dark-800 border border-dark-700/30 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-barber-400/50"
                >
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>
              </div>
              <div>
                <label className="text-dark-400 text-xs mb-1 block">
                  Catatan
                </label>
                <textarea
                  value={addForm.notes}
                  onChange={(e) =>
                    setAddForm((f) => ({ ...f, notes: e.target.value }))
                  }
                  rows={2}
                  className="w-full bg-dark-800 border border-dark-700/30 rounded-xl px-3 py-2 text-sm text-white placeholder-dark-500 focus:outline-none focus:border-barber-400/50 resize-none"
                  placeholder="Catatan awal"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={
                    isPending ||
                    !addForm.name.trim() ||
                    !addForm.contact.trim()
                  }
                  className="flex-1 py-2.5 rounded-xl bg-barber-400 text-dark-900 font-medium disabled:opacity-50"
                >
                  {isPending ? "Menyimpan..." : "Simpan"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setAddForm(EMPTY_ADD_FORM);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-dark-700/50 text-dark-400 text-sm hover:bg-dark-700 transition-colors"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

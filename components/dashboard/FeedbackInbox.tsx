"use client";

import { useState } from "react";
import { markFeedbackAsRead, deleteFeedback } from "@/app/dashboard/feedback/actions";
import type { Tables } from "@/lib/supabase/types";

type Feedback = Tables<"feedback">;

const categoryLabels: Record<string, string> = {
  kritik: "Kritik", saran: "Saran", feedback: "Feedback", request_fitur: "Request Fitur",
};

const categoryColors: Record<string, string> = {
  kritik: "text-red-400 bg-red-500/10 border-red-500/20",
  saran: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  feedback: "text-green-400 bg-green-500/10 border-green-500/20",
  request_fitur: "text-purple-400 bg-purple-500/10 border-purple-500/20",
};

interface FeedbackInboxProps {
  initialData: Feedback[];
}

export default function FeedbackInbox({ initialData }: FeedbackInboxProps) {
  const [items, setItems] = useState<Feedback[]>(initialData);
  const [selected, setSelected] = useState<Feedback | null>(null);

  const handleMarkRead = async (id: string) => {
    const result = await markFeedbackAsRead(id);
    if (!result.error) {
      setItems((prev) => prev.map((item) => item.id === id ? { ...item, is_read: true } : item));
    }
  };

  const handleDelete = async (id: string) => {
    const result = await deleteFeedback(id);
    if (!result.error) {
      setItems((prev) => prev.filter((item) => item.id !== id));
      if (selected?.id === id) setSelected(null);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  if (items.length === 0) {
    return (
      <div className="bg-dark-800/50 border border-dark-700/30 rounded-2xl p-12 text-center">
        <p className="text-dark-400">Belum ada feedback masuk</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-3">
        {items.map((item) => (
          <button key={item.id} type="button" onClick={() => setSelected(item)}
            className={`w-full text-left p-4 rounded-2xl border transition-all ${
              selected?.id === item.id ? "bg-barber-400/5 border-barber-400/20" : "bg-dark-800/50 border-dark-700/30 hover:bg-dark-800/80"
            }`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${categoryColors[item.category] ?? "text-dark-400 bg-dark-800 border-dark-700/30"}`}>
                    {categoryLabels[item.category] ?? item.category}
                  </span>
                  {!item.is_read && <span className="w-2 h-2 rounded-full bg-barber-400" />}
                </div>
                <p className="text-white font-medium text-sm truncate">{item.name}</p>
                <p className="text-dark-400 text-xs mt-1 line-clamp-2">{item.message}</p>
              </div>
              <span className="text-dark-500 text-xs shrink-0">{formatDate(item.created_at)}</span>
            </div>
          </button>
        ))}
      </div>

      <div>
        {selected ? (
          <div className="bg-dark-800/50 border border-dark-700/30 rounded-2xl p-6 space-y-4 sticky top-6">
            <div className="flex items-center justify-between">
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${categoryColors[selected.category] ?? "text-dark-400 bg-dark-800 border-dark-700/30"}`}>
                {categoryLabels[selected.category] ?? selected.category}
              </span>
              <span className="text-dark-500 text-xs">{formatDate(selected.created_at)}</span>
            </div>
            <div>
              <p className="text-dark-400 text-xs mb-1">Dari</p>
              <p className="text-white font-medium">{selected.name}</p>
            </div>
            <div>
              <p className="text-dark-400 text-xs mb-1">Pesan</p>
              <p className="text-dark-100 text-sm whitespace-pre-wrap">{selected.message}</p>
            </div>
            {selected.screenshot_url && (
              <div>
                <p className="text-dark-400 text-xs mb-1">Screenshot</p>
                <a href={selected.screenshot_url} target="_blank" rel="noopener noreferrer">
                  <img src={selected.screenshot_url} alt="Feedback screenshot" className="max-w-full h-48 object-cover rounded-xl border border-dark-700/30" />
                </a>
              </div>
            )}
            <div className="flex gap-3 pt-2">
              {!selected.is_read && (
                <button type="button" onClick={() => handleMarkRead(selected.id)}
                  className="px-4 py-2 rounded-xl bg-dark-700/50 text-dark-200 text-sm hover:bg-dark-700 transition-colors">
                  Tandai Sudah Dibaca
                </button>
              )}
              <button type="button" onClick={() => handleDelete(selected.id)}
                className="px-4 py-2 rounded-xl bg-red-500/10 text-red-400 text-sm hover:bg-red-500/20 transition-colors">
                Hapus
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-dark-800/50 border border-dark-700/30 rounded-2xl p-12 text-center">
            <p className="text-dark-500">Pilih feedback untuk melihat detail</p>
          </div>
        )}
      </div>
    </div>
  );
}

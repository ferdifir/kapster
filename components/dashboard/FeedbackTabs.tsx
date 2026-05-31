"use client";

import { useState } from "react";

interface FeedbackTabsProps {
  form: React.ReactNode;
  inbox: React.ReactNode;
  unreadCount: number;
}

export default function FeedbackTabs({ form, inbox, unreadCount }: FeedbackTabsProps) {
  const [active, setActive] = useState<"form" | "inbox">("form");

  const tabs = [
    { key: "form" as const, label: "Kirim Feedback" },
    { key: "inbox" as const, label: "Inbox", count: unreadCount },
  ];

  return (
    <div>
      <div className="flex gap-1 mb-6 p-1 bg-dark-800/50 rounded-xl border border-dark-700/30 w-fit">
        {tabs.map((tab) => (
          <button key={tab.key} type="button" onClick={() => setActive(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              active === tab.key ? "bg-barber-400/10 text-barber-400" : "text-dark-400 hover:text-dark-200"
            }`}>
            {tab.label}
            {tab.count > 0 && (
              <span className="w-5 h-5 rounded-full bg-barber-400/20 text-barber-400 text-xs flex items-center justify-center">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>
      {active === "form" ? form : inbox}
    </div>
  );
}

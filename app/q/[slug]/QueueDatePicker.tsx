"use client";

import { useState } from "react";

interface Props {
  today: string;
  maxDate: string;
  value: string;
}

const DAYS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default function QueueDatePicker({ today, maxDate, value }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => {
    const d = new Date(value);
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  const selectedDate = new Date(value);
  const todayDate = new Date(today);
  const maxDateObj = new Date(maxDate);

  const daysInMonth = getDaysInMonth(viewDate.year, viewDate.month);
  const firstDay = getFirstDayOfMonth(viewDate.year, viewDate.month);

  const prevMonth = () => {
    setViewDate((prev) => {
      if (prev.month === 0) return { year: prev.year - 1, month: 11 };
      return { ...prev, month: prev.month - 1 };
    });
  };

  const nextMonth = () => {
    setViewDate((prev) => {
      if (prev.month === 11) return { year: prev.year + 1, month: 0 };
      return { ...prev, month: prev.month + 1 };
    });
  };

  const isDateDisabled = (day: number) => {
    const date = new Date(viewDate.year, viewDate.month, day);
    return date < todayDate || date > maxDateObj;
  };

  const isDateSelected = (day: number) => {
    return (
      viewDate.year === selectedDate.getFullYear() &&
      viewDate.month === selectedDate.getMonth() &&
      day === selectedDate.getDate()
    );
  };

  const isToday = (day: number) => {
    return (
      viewDate.year === todayDate.getFullYear() &&
      viewDate.month === todayDate.getMonth() &&
      day === todayDate.getDate()
    );
  };

  const selectDate = (day: number) => {
    if (isDateDisabled(day)) return;
    const newDate = new Date(viewDate.year, viewDate.month, day);
    const url = new URL(window.location.href);
    url.searchParams.set("date", formatDate(newDate));
    window.location.href = url.toString();
  };

  const displayValue = selectedDate.toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const canPrev = !(
    viewDate.year === todayDate.getFullYear() &&
    viewDate.month === todayDate.getMonth()
  );

  const canNext = !(
    viewDate.year === maxDateObj.getFullYear() &&
    viewDate.month === maxDateObj.getMonth()
  );

  return (
    <div className="mb-6">
      <label className="block text-dark-400 text-xs font-semibold mb-2">Pilih Tanggal Antrean</label>

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 rounded-xl bg-dark-700/50 border border-dark-600/50 text-white text-sm focus:outline-none focus:border-barber-400/50 transition-colors flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <svg className="w-5 h-5 text-barber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>{displayValue}</span>
        </div>
        <svg
          className={`w-4 h-4 text-dark-500 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="mt-2 bg-dark-800 border border-dark-700/50 rounded-xl p-4 shadow-2xl">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={prevMonth}
              disabled={!canPrev}
              className="p-1.5 rounded-lg hover:bg-dark-700 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-sm font-semibold text-white">
              {MONTHS[viewDate.month]} {viewDate.year}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              disabled={!canNext}
              className="p-1.5 rounded-lg hover:bg-dark-700 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {DAYS.map((day) => (
              <div key={day} className="text-center text-[10px] font-semibold text-dark-500 uppercase py-1">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const disabled = isDateDisabled(day);
              const selected = isDateSelected(day);
              const todayMark = isToday(day);

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => selectDate(day)}
                  disabled={disabled}
                  className={`
                    relative h-9 rounded-lg text-sm font-medium transition-all
                    ${selected
                      ? "bg-barber-400 text-dark-950"
                      : disabled
                        ? "text-dark-700 cursor-not-allowed"
                        : todayMark
                          ? "text-barber-400 hover:bg-dark-700"
                          : "text-white hover:bg-dark-700"
                    }
                  `}
                >
                  {day}
                  {todayMark && !selected && (
                    <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-barber-400 rounded-full" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

interface Props {
  today: string;
  maxDate: string;
  value: string;
}

export default function QueueDatePicker({ today, maxDate, value }: Props) {
  return (
    <div className="mb-6">
      <label className="block text-dark-400 text-xs font-semibold mb-2">Pilih Tanggal Antrean</label>
      <input
        type="date"
        min={today}
        max={maxDate}
        defaultValue={value}
        onChange={(e) => {
          const url = new URL(window.location.href);
          url.searchParams.set("date", e.target.value);
          window.location.href = url.toString();
        }}
        className="w-full px-4 py-3 rounded-xl bg-dark-700/50 border border-dark-600/50 text-white text-sm focus:outline-none focus:border-barber-400/50 transition-colors"
      />
    </div>
  );
}

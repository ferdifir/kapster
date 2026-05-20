"use client";

import { useState } from "react";

interface MobileBottomSheetProps {
  isFutureDate: boolean;
  children: React.ReactNode;
}

export default function MobileBottomSheet({ isFutureDate, children }: MobileBottomSheetProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile CTA Button */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-dark-950 via-dark-950/95 to-transparent z-40">
        <button
          onClick={() => setIsOpen(true)}
          className="w-full bg-barber-400 hover:bg-barber-500 text-dark-900 font-bold py-3.5 px-6 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
          </svg>
          Ambil Nomor Antrean / Booking
        </button>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/70 z-50 transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Bottom Sheet */}
      <div
        className={`fixed bottom-0 left-0 right-0 bg-dark-900 rounded-t-3xl border-t border-dark-800 z-50 transform transition-transform max-h-[85vh] overflow-y-auto p-6 ${
          isOpen ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div
          className="w-12 h-1.5 bg-dark-700 rounded-full mx-auto mb-6 cursor-pointer"
          onClick={() => setIsOpen(false)}
        />
        <div>
          <h3 className="text-xl font-bold text-white mb-1">Daftar Antrean</h3>
          {isFutureDate && (
            <p className="text-xs text-amber-400 mb-6 flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              Jam operasional belum dibuka. Anda akan masuk daftar reservasi dimuka.
            </p>
          )}
          {children}
        </div>
      </div>
    </>
  );
}

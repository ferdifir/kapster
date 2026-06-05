"use client";

import Link from "next/link";

export default function AffiliateFloatingBadge() {
  return (
    <Link
      href="/referral/daftar"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-gradient-to-r from-barber-400 to-barber-600 px-5 py-3 text-sm font-semibold text-dark-950 shadow-lg shadow-barber-500/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-barber-500/50 animate-float"
    >
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      Rp3.500/referral
    </Link>
  );
}

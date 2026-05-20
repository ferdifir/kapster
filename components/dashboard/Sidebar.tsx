"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "@/components/Logo";

const navItems = [
  {
    href: "/dashboard",
    label: "Overview",
    icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
  },
  {
    href: "/dashboard/queue",
    label: "Antrian",
    icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0",
  },
  {
    href: "/dashboard/bookings",
    label: "Booking",
    icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
  },
  {
    href: "/dashboard/barbers",
    label: "Barber",
    icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z",
  },
  {
    href: "/dashboard/services",
    label: "Layanan",
    icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
  },
  {
    href: "/dashboard/analytics",
    label: "Analitik",
    icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
  },
  {
    href: "/dashboard/settings",
    label: "Pengaturan",
    icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
  },
];

export default function DashboardSidebar({
  barbershop,
  mobileOpen,
  onClose,
}: {
  barbershop: { name: string; slug: string };
  mobileOpen?: boolean;
  onClose?: () => void;
}) {
  const pathname = usePathname();

  const navContent = (
    <>
      {/* Logo */}
      <div className="px-6 py-5 border-b border-dark-800/50">
        <Link href="/dashboard" className="flex items-center gap-3" onClick={onClose}>
          <div className="w-8 h-8 rounded-lg gold-gradient flex items-center justify-center">
            <Logo className="w-5 h-5 text-dark-900" />
          </div>
          <span className="font-display text-lg font-bold text-white">
            Kapster
          </span>
        </Link>
      </div>

      {/* Barbershop name */}
      <div className="px-4 py-3 border-b border-dark-800/50">
        <p className="text-dark-500 text-xs mb-1">Barbershop</p>
        <p className="text-white text-sm font-medium truncate">{barbershop.name}</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                isActive
                  ? "bg-barber-400/10 text-barber-400 border border-barber-400/20"
                  : "text-dark-400 hover:text-white hover:bg-dark-800/50"
              }`}
            >
              <svg
                className="w-5 h-5 shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d={item.icon}
                />
              </svg>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom links */}
      <div className="px-3 py-4 border-t border-dark-800/50 space-y-1">
        <a
          href={`/q/${barbershop.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-dark-400 hover:text-white hover:bg-dark-800/50 transition-all"
        >
          <svg
            className="w-5 h-5 shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
          Lihat Halaman Publik
        </a>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={`fixed left-0 top-0 h-full w-64 bg-dark-900 border-r border-dark-800/50 flex flex-col z-50 transform transition-transform duration-200 lg:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {navContent}
      </aside>

      {/* Desktop sidebar */}
      <aside className="w-64 shrink-0 bg-dark-900 border-r border-dark-800/50 flex flex-col hidden lg:flex">
        {navContent}
      </aside>
    </>
  );
}

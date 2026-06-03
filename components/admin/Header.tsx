"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AdminHeader({
  user,
  onMenuToggle,
}: {
  user: { email: string; full_name: string | null };
  onMenuToggle?: () => void;
}) {
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  const initials = user.full_name
    ? user.full_name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : user.email[0].toUpperCase();

  return (
    <header className="h-14 border-b border-dark-800/50 bg-dark-900/50 backdrop-blur-sm flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center gap-3">
        <button onClick={onMenuToggle} className="lg:hidden text-dark-300 hover:text-white p-2 -ml-2" aria-label="Toggle menu">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div className="lg:hidden">
          <span className="font-display text-lg font-bold text-white">Admin</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="text-right hidden sm:block">
          <p className="text-white text-sm font-medium leading-none">{user.full_name ?? user.email}</p>
          <p className="text-dark-500 text-xs mt-0.5">{user.email}</p>
        </div>
        <div className="w-8 h-8 rounded-full gold-gradient flex items-center justify-center text-dark-900 text-sm font-bold">{initials}</div>
        <button onClick={handleSignOut} className="p-2 rounded-lg text-dark-400 hover:text-white hover:bg-dark-800 transition-colors" title="Keluar">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>
    </header>
  );
}

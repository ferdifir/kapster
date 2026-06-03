"use client";

export default function AdminHeader({
  user,
  onMenuToggle,
}: {
  user: { first_name: string; username?: string };
  onMenuToggle?: () => void;
}) {
  const initials = user.first_name.charAt(0).toUpperCase();

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
          <p className="text-white text-sm font-medium leading-none">{user.first_name}</p>
          {user.username && <p className="text-dark-500 text-xs mt-0.5">@{user.username}</p>}
        </div>
        <div className="w-8 h-8 rounded-full gold-gradient flex items-center justify-center text-dark-900 text-sm font-bold">{initials}</div>
      </div>
    </header>
  );
}

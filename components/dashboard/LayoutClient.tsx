"use client";

import { useState } from "react";
import DashboardSidebar from "@/components/dashboard/Sidebar";
import DashboardHeader from "@/components/dashboard/Header";

export default function DashboardLayoutClient({
  children,
  barbershop,
  user,
}: {
  children: React.ReactNode;
  barbershop: { name: string; slug: string; plan: string };
  user: { email: string; full_name: string | null };
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="h-screen bg-dark-950 flex">
      <DashboardSidebar
        barbershop={barbershop}
        mobileOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader
          user={user}
          barbershop={barbershop}
          onMenuToggle={() => setMobileMenuOpen((v) => !v)}
        />
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function BarberLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  return (
    <div className="min-h-screen bg-dark-950">
      <header className="h-14 bg-dark-900/80 border-b border-dark-800/50 backdrop-blur-sm flex items-center px-4 sticky top-0 z-10">
        <span className="font-display text-base font-bold text-white">
          Queue<span className="text-barber-400">Barber</span>
          <span className="text-dark-500 text-sm font-normal ml-2">
            · Barber View
          </span>
        </span>
      </header>
      <main>{children}</main>
    </div>
  );
}

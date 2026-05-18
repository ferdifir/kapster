import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DashboardSidebar from "@/components/dashboard/Sidebar";
import DashboardHeader from "@/components/dashboard/Header";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: barbershop } = await supabase
    .from("barbershops")
    .select("id, name, slug, plan")
    .eq("owner_id", user.id)
    .single();

  if (!barbershop) redirect("/onboarding");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, avatar_url")
    .eq("id", user.id)
    .single();

  return (
    <div className="h-screen bg-dark-950 flex">
      <DashboardSidebar barbershop={barbershop} />
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader
          user={{ email: user.email ?? "", full_name: profile?.full_name ?? null }}
          barbershop={barbershop}
        />
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}

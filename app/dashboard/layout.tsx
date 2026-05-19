import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DashboardLayoutClient from "@/components/dashboard/LayoutClient";

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
    <DashboardLayoutClient
      barbershop={barbershop}
      user={{ email: user.email ?? "", full_name: profile?.full_name ?? null }}
    >
      {children}
    </DashboardLayoutClient>
  );
}

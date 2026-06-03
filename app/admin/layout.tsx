import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { verifySuperAdmin } from "@/lib/admin-auth";
import AdminLayoutClient from "@/components/admin/LayoutClient";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const isSuperAdmin = await verifySuperAdmin(user.id);
  if (!isSuperAdmin) {
    return (
      <div className="h-screen bg-dark-950 flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <h1 className="font-display text-2xl font-bold text-white mb-2">Akses Ditolak</h1>
          <p className="text-dark-400">Hanya superadmin yang bisa mengakses halaman ini.</p>
        </div>
      </div>
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  return (
    <AdminLayoutClient
      user={{ email: user.email ?? "", full_name: profile?.full_name ?? null }}
    >
      {children}
    </AdminLayoutClient>
  );
}

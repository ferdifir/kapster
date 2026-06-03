import { verifyAdminSession } from "@/lib/admin-auth";
import AdminLayoutClient from "@/components/admin/LayoutClient";
import AdminAuthGate from "@/components/admin/AuthGate";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await verifyAdminSession();

  if (!admin) {
    return <AdminAuthGate />;
  }

  return (
    <AdminLayoutClient
      user={{ first_name: admin.first_name, username: admin.username }}
    >
      {children}
    </AdminLayoutClient>
  );
}

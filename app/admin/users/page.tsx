import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/types";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; q?: string }>;
}) {
  const supabase = createAdminClient();
  const params = await searchParams;

  let query = supabase
    .from("profiles")
    .select("id, full_name, phone, role, phone_verified_at, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  if (params.role) query = query.eq("role", params.role as Database["public"]["Enums"]["user_role"]);
  if (params.q) query = query.ilike("full_name", `%${params.q}%`);

  const { data: users } = await query;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <h1 className="font-display text-2xl font-bold text-white">Users</h1>

      <form className="flex flex-col sm:flex-row gap-3">
        <input name="q" defaultValue={params.q} placeholder="Cari user..." className="w-full sm:flex-1 px-4 py-2 rounded-xl bg-dark-800 border border-dark-700 text-white placeholder:text-dark-500 text-sm focus:outline-none focus:border-barber-400/50" />
        <div className="flex gap-3">
          <select name="role" defaultValue={params.role ?? ""} className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-dark-800 border border-dark-700 text-dark-200 text-sm focus:outline-none focus:border-barber-400/50">
            <option value="">Semua Role</option>
            <option value="owner">Owner</option>
            <option value="barber">Barber</option>
            <option value="customer">Customer</option>
            <option value="superadmin">Superadmin</option>
          </select>
          <button type="submit" className="px-4 py-2 rounded-xl bg-barber-400/10 text-barber-400 border border-barber-400/20 text-sm hover:bg-barber-400/20 transition-all">Filter</button>
        </div>
      </form>

      <div className="bg-dark-800/50 border border-dark-700/30 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[450px]">
            <thead>
              <tr className="border-b border-dark-700/30 text-left text-dark-400 text-sm">
                <th className="p-4 font-medium whitespace-nowrap">Nama</th>
                <th className="p-4 font-medium whitespace-nowrap hidden sm:table-cell">Telepon</th>
                <th className="p-4 font-medium whitespace-nowrap">Role</th>
                <th className="p-4 font-medium whitespace-nowrap">Verified</th>
                <th className="p-4 font-medium whitespace-nowrap hidden md:table-cell">Dibuat</th>
              </tr>
            </thead>
            <tbody>
              {users?.map((u) => (
                <tr key={u.id} className="border-b border-dark-700/20 hover:bg-dark-700/20 transition-colors">
                  <td className="p-4 text-white font-medium whitespace-nowrap">{u.full_name ?? "-"}</td>
                  <td className="p-4 text-dark-300 whitespace-nowrap hidden sm:table-cell">{u.phone ?? "-"}</td>
                  <td className="p-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                      u.role === "superadmin" ? "bg-barber-400/10 text-barber-400" :
                      u.role === "owner" ? "bg-blue-500/10 text-blue-400" :
                      "bg-dark-700/50 text-dark-300"
                    }`}>{u.role}</span>
                  </td>
                  <td className="p-4 whitespace-nowrap">{u.phone_verified_at ? <span className="text-green-400 text-sm">✓</span> : <span className="text-dark-500 text-sm">-</span>}</td>
                  <td className="p-4 text-dark-400 text-sm whitespace-nowrap hidden md:table-cell">{new Date(u.created_at).toLocaleDateString("id-ID")}</td>
                </tr>
              ))}
              {(!users || users.length === 0) && (
                <tr><td colSpan={5} className="p-8 text-center text-dark-500">Tidak ada user ditemukan</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

import { createAdminClient } from "@/lib/supabase/admin";

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

  if (params.role) query = query.eq("role", params.role);
  if (params.q) query = query.ilike("full_name", `%${params.q}%`);

  const { data: users } = await query;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <h1 className="font-display text-2xl font-bold text-white">Users</h1>

      <div className="flex gap-3">
        <form className="flex-1 flex gap-3">
          <input name="q" defaultValue={params.q} placeholder="Cari user..." className="flex-1 px-4 py-2 rounded-xl bg-dark-800 border border-dark-700 text-white placeholder:text-dark-500 text-sm focus:outline-none focus:border-barber-400/50" />
          <select name="role" defaultValue={params.role ?? ""} className="px-4 py-2 rounded-xl bg-dark-800 border border-dark-700 text-dark-200 text-sm focus:outline-none focus:border-barber-400/50">
            <option value="">Semua Role</option>
            <option value="owner">Owner</option>
            <option value="barber">Barber</option>
            <option value="customer">Customer</option>
            <option value="superadmin">Superadmin</option>
          </select>
          <button type="submit" className="px-4 py-2 rounded-xl bg-barber-400/10 text-barber-400 border border-barber-400/20 text-sm hover:bg-barber-400/20 transition-all">Filter</button>
        </form>
      </div>

      <div className="bg-dark-800/50 border border-dark-700/30 rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-dark-700/30 text-left text-dark-400 text-sm">
              <th className="p-4 font-medium">Nama</th>
              <th className="p-4 font-medium">Telepon</th>
              <th className="p-4 font-medium">Role</th>
              <th className="p-4 font-medium">Verified</th>
              <th className="p-4 font-medium">Dibuat</th>
            </tr>
          </thead>
          <tbody>
            {users?.map((u) => (
              <tr key={u.id} className="border-b border-dark-700/20 hover:bg-dark-700/20 transition-colors">
                <td className="p-4 text-white font-medium">{u.full_name ?? "-"}</td>
                <td className="p-4 text-dark-300">{u.phone ?? "-"}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                    u.role === "superadmin" ? "bg-barber-400/10 text-barber-400" :
                    u.role === "owner" ? "bg-blue-500/10 text-blue-400" :
                    "bg-dark-700/50 text-dark-300"
                  }`}>{u.role}</span>
                </td>
                <td className="p-4">{u.phone_verified_at ? <span className="text-green-400 text-sm">✓</span> : <span className="text-dark-500 text-sm">-</span>}</td>
                <td className="p-4 text-dark-400 text-sm">{new Date(u.created_at).toLocaleDateString("id-ID")}</td>
              </tr>
            ))}
            {(!users || users.length === 0) && (
              <tr><td colSpan={5} className="p-8 text-center text-dark-500">Tidak ada user ditemukan</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

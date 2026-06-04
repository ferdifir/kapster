import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";

export default async function AdminBarbershopsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; city?: string; status?: string }>;
}) {
  const supabase = createAdminClient();
  const params = await searchParams;

  let query = supabase
    .from("barbershops")
    .select("id, name, slug, city, owner_id, created_at, profiles!barbershops_owner_id_fkey(full_name, phone)");

  if (params.q) query = query.ilike("name", `%${params.q}%`);
  if (params.city) query = query.eq("city", params.city);

  const { data: barbershops } = await query.order("created_at", { ascending: false }).limit(50);

  const { data: subscriptions } = await supabase
    .from("subscriptions")
    .select("barbershop_id, status");

  const subMap = new Map(subscriptions?.map((s) => [s.barbershop_id, s.status]) ?? []);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-white">Barbershops</h1>
      </div>

      <form className="flex flex-col sm:flex-row gap-3">
        <input name="q" defaultValue={params.q} placeholder="Cari barbershop..." className="w-full sm:flex-1 px-4 py-2 rounded-xl bg-dark-800 border border-dark-700 text-white placeholder:text-dark-500 text-sm focus:outline-none focus:border-barber-400/50" />
        <button type="submit" className="w-full sm:w-auto px-4 py-2 rounded-xl bg-barber-400/10 text-barber-400 border border-barber-400/20 text-sm hover:bg-barber-400/20 transition-all">Cari</button>
      </form>

      <div className="bg-dark-800/50 border border-dark-700/30 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[500px]">
            <thead>
              <tr className="border-b border-dark-700/30 text-left text-dark-400 text-sm">
                <th className="p-4 font-medium whitespace-nowrap">Nama</th>
                <th className="p-4 font-medium whitespace-nowrap hidden sm:table-cell">Pemilik</th>
                <th className="p-4 font-medium whitespace-nowrap">Kota</th>
                <th className="p-4 font-medium whitespace-nowrap">Status</th>
                <th className="p-4 font-medium whitespace-nowrap hidden md:table-cell">Dibuat</th>
                <th className="p-4 font-medium whitespace-nowrap" />
              </tr>
            </thead>
            <tbody>
              {barbershops?.map((bs) => {
                const subStatus = subMap.get(bs.id);
                const profile = bs.profiles as { full_name: string | null; phone: string | null } | null;
                return (
                  <tr key={bs.id} className="border-b border-dark-700/20 hover:bg-dark-700/20 transition-colors">
                    <td className="p-4 text-white font-medium whitespace-nowrap">{bs.name}</td>
                    <td className="p-4 text-dark-300 whitespace-nowrap hidden sm:table-cell">{profile?.full_name ?? "-"}</td>
                    <td className="p-4 text-dark-300 whitespace-nowrap">{bs.city ?? "-"}</td>
                    <td className="p-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-lg text-xs font-medium ${subStatus === "active" ? "bg-green-500/10 text-green-400" : "bg-dark-700/50 text-dark-400"}`}>
                        {subStatus === "active" ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="p-4 text-dark-400 text-sm whitespace-nowrap hidden md:table-cell">{new Date(bs.created_at).toLocaleDateString("id-ID")}</td>
                    <td className="p-4 whitespace-nowrap">
                      <Link href={`/admin/barbershops/${bs.id}`} className="text-barber-400 text-sm hover:underline">Detail</Link>
                    </td>
                  </tr>
                );
              })}
              {(!barbershops || barbershops.length === 0) && (
                <tr><td colSpan={6} className="p-8 text-center text-dark-500">Tidak ada barbershop ditemukan</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

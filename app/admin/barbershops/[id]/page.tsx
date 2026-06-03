import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";

export default async function AdminBarbershopDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { data: barbershop } = await supabase
    .from("barbershops")
    .select("*, profiles!barbershops_owner_id_fkey(full_name, phone)")
    .eq("id", id)
    .single();

  if (!barbershop) notFound();

  const { count: barberCount } = await supabase
    .from("barbers")
    .select("*", { count: "exact", head: true })
    .eq("barbershop_id", id);

  const { data: barbershopQueues } = await supabase
    .from("queues")
    .select("id")
    .eq("barbershop_id", id);

  const queueIds = barbershopQueues?.map(q => q.id) ?? [];

  const { count: totalCustomers } = queueIds.length > 0
    ? await supabase
        .from("queue_entries")
        .select("*", { count: "exact", head: true })
        .in("queue_id", queueIds)
        .eq("status", "done")
    : { count: 0 };

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("barbershop_id", id)
    .maybeSingle();

  const profile = barbershop.profiles as { full_name: string | null; phone: string | null } | null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="font-display text-2xl font-bold text-white">{barbershop.name}</h1>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-dark-800/50 border border-dark-700/30">
          <p className="text-dark-400 text-xs mb-1">Barber</p>
          <p className="text-white font-display text-2xl font-bold">{barberCount ?? 0}</p>
        </div>
        <div className="p-4 rounded-2xl bg-dark-800/50 border border-dark-700/30">
          <p className="text-dark-400 text-xs mb-1">Pelanggan Selesai</p>
          <p className="text-white font-display text-2xl font-bold">{totalCustomers ?? 0}</p>
        </div>
        <div className="p-4 rounded-2xl bg-dark-800/50 border border-dark-700/30">
          <p className="text-dark-400 text-xs mb-1">Subscription</p>
          <p className={`font-display text-2xl font-bold ${subscription?.status === "active" ? "text-green-400" : "text-dark-400"}`}>{subscription?.status ?? "none"}</p>
        </div>
      </div>

      <div className="bg-dark-800/50 border border-dark-700/30 rounded-2xl p-6 space-y-4">
        <h2 className="font-semibold text-white">Informasi</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><span className="text-dark-400">Pemilik:</span> <span className="text-white ml-2">{profile?.full_name ?? "-"}</span></div>
          <div><span className="text-dark-400">Telepon:</span> <span className="text-white ml-2">{barbershop.phone ?? "-"}</span></div>
          <div><span className="text-dark-400">Kota:</span> <span className="text-white ml-2">{barbershop.city ?? "-"}</span></div>
          <div><span className="text-dark-400">Slug:</span> <span className="text-white ml-2">{barbershop.slug}</span></div>
          <div><span className="text-dark-400">WhatsApp:</span> <span className={`ml-2 ${barbershop.wa_connected ? "text-green-400" : "text-dark-400"}`}>{barbershop.wa_connected ? "Terhubung" : "Tidak terhubung"}</span></div>
        </div>
      </div>
    </div>
  );
}

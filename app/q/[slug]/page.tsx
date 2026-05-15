import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import JoinQueueForm from "./JoinQueueForm";

export default async function PublicQueuePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: barbershop } = await supabase
    .from("barbershops")
    .select("id, name, city, address")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (!barbershop) notFound();

  const today = new Date().toISOString().split("T")[0];

  const [
    { data: queue },
    { data: services },
    { data: barbers },
  ] = await Promise.all([
    supabase
      .from("queues")
      .select("id, is_open, total_served")
      .eq("barbershop_id", barbershop.id)
      .eq("date", today)
      .maybeSingle(),
    supabase
      .from("services")
      .select("id, name, price, duration_min")
      .eq("barbershop_id", barbershop.id)
      .eq("is_active", true),
    supabase
      .from("barbers")
      .select("id, display_name")
      .eq("barbershop_id", barbershop.id)
      .eq("is_active", true),
  ]);

  const { count: waitingCount } =
    queue?.is_open
      ? await supabase
          .from("queue_entries")
          .select("id", { count: "exact", head: true })
          .eq("queue_id", queue.id)
          .in("status", ["waiting", "called", "serving"])
      : { count: 0 };

  const isOpen = !!queue?.is_open;

  return (
    <div className="min-h-screen bg-dark-950">
      <div className="bg-dark-900/80 border-b border-dark-800/50 px-4 py-4 text-center">
        <span className="font-display text-sm font-bold text-white">
          Queue<span className="text-barber-400">Barber</span>
        </span>
      </div>

      <div className="max-w-md mx-auto px-4 py-8 space-y-6">
        {/* Shop info */}
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl gold-gradient flex items-center justify-center mx-auto mb-4">
            <span className="font-display text-xl font-bold text-dark-900">
              {barbershop.name[0]}
            </span>
          </div>
          <h1 className="font-display text-2xl font-bold text-white">
            {barbershop.name}
          </h1>
          {barbershop.city && (
            <p className="text-dark-400 text-sm mt-1">{barbershop.city}</p>
          )}
        </div>

        {!isOpen ? (
          <div className="bg-dark-800/50 border border-dark-700/30 rounded-2xl p-8 text-center">
            <div className="w-12 h-12 rounded-xl bg-dark-700/50 flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-6 h-6 text-dark-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <p className="text-dark-300 font-semibold">Antrian Sedang Tutup</p>
            <p className="text-dark-500 text-sm mt-1">
              Silakan datang kembali saat barbershop buka
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-barber-400/10 border border-barber-400/20 rounded-xl p-4 text-center">
                <p className="font-display text-3xl font-bold text-barber-400">
                  {waitingCount ?? 0}
                </p>
                <p className="text-dark-400 text-sm mt-1">Sedang Menunggu</p>
              </div>
              <div className="bg-dark-800/50 border border-dark-700/30 rounded-xl p-4 text-center">
                <p className="font-display text-3xl font-bold text-white">
                  {queue?.total_served ?? 0}
                </p>
                <p className="text-dark-400 text-sm mt-1">Selesai Hari Ini</p>
              </div>
            </div>

            <JoinQueueForm
              queueId={queue!.id}
              slug={slug}
              services={services ?? []}
              barbers={barbers ?? []}
            />
          </>
        )}
      </div>
    </div>
  );
}

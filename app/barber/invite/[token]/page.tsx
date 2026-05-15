import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import InviteClaim from "./InviteClaim";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Check if token is valid (barbershop name + barber name for display)
  const { data: barber } = await supabase
    .from("barbers")
    .select("id, display_name, profile_id, barbershops(name)")
    .eq("invite_token", token)
    .maybeSingle();

  if (!barber) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="font-display text-2xl font-bold text-white mb-2">Link Tidak Valid</p>
          <p className="text-dark-400 text-sm">Token undangan tidak ditemukan atau sudah kadaluarsa</p>
        </div>
      </div>
    );
  }

  // Already claimed
  if (barber.profile_id) {
    if (user && barber.profile_id === user.id) {
      redirect("/barber");
    }
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="font-display text-2xl font-bold text-white mb-2">Sudah Diklaim</p>
          <p className="text-dark-400 text-sm">Undangan ini sudah digunakan oleh barber lain</p>
        </div>
      </div>
    );
  }

  const barbershopName =
    barber.barbershops && !Array.isArray(barber.barbershops)
      ? (barber.barbershops as { name: string }).name
      : "";

  return (
    <InviteClaim
      token={token}
      barberName={barber.display_name}
      barbershopName={barbershopName}
      isLoggedIn={!!user}
    />
  );
}

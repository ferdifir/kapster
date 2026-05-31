import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import FeedbackForm from "@/components/dashboard/FeedbackForm";
import FeedbackInbox from "@/components/dashboard/FeedbackInbox";
import FeedbackTabs from "@/components/dashboard/FeedbackTabs";

export const dynamic = "force-dynamic";

export default async function FeedbackPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: barbershop } = await supabase
    .from("barbershops")
    .select("id, name")
    .eq("owner_id", user.id)
    .single();

  if (!barbershop) redirect("/onboarding");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("id", user.id)
    .single();

  const { data: feedbackList } = await supabase
    .from("feedback")
    .select("*")
    .eq("barbershop_id", barbershop.id)
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-white mb-1">Kritik & Saran</h1>
        <p className="text-dark-400 text-sm">Kirim masukan atau lihat feedback yang masuk</p>
      </div>

      <FeedbackTabs
        form={
          <FeedbackForm
            barbershopId={barbershop.id}
            profileId={profile?.id ?? null}
            profileName={profile?.full_name ?? null}
          />
        }
        inbox={<FeedbackInbox initialData={feedbackList ?? []} />}
        unreadCount={feedbackList?.filter((f) => !f.is_read).length ?? 0}
      />
    </div>
  );
}

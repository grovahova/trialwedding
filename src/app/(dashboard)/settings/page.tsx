import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { WeddingSettingsForm } from "@/components/settings/wedding-settings-form";
import { MembersTable } from "@/components/settings/members-table";
import type { Profile, WeddingSettings } from "@/lib/types";

export default async function SettingsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, { data: settings }, { data: members }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("wedding_settings").select("*").eq("id", 1).single(),
    supabase.from("profiles").select("*").order("full_name"),
  ]);

  if ((profile as Profile | null)?.role !== "admin") {
    return (
      <div className="rounded-xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
        Only admins can access settings.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-display text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">Wedding details, roles, and access.</p>
      </div>
      {settings && <WeddingSettingsForm settings={settings as WeddingSettings} />}
      <MembersTable members={(members as Profile[]) ?? []} currentUserId={user.id} />
    </div>
  );
}

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import type { Profile, WeddingEvent } from "@/lib/types";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  const { data: events } = await supabase
    .from("events")
    .select("*")
    .eq("status", "active")
    .order("position");

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar events={(events as WeddingEvent[]) ?? []} profile={(profile as Profile) ?? null} />
      <div className="flex min-h-screen flex-1 flex-col">
        {profile && <Topbar profile={profile as Profile} events={(events as WeddingEvent[]) ?? []} />}
        <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}

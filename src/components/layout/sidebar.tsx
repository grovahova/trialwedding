"use client";

import { SidebarNavContent } from "@/components/layout/sidebar-nav";
import type { Profile, WeddingEvent } from "@/lib/types";

export function Sidebar({ events, profile }: { events: WeddingEvent[]; profile: Profile | null }) {
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-card/60 lg:flex">
      <SidebarNavContent events={events} profile={profile} />
    </aside>
  );
}

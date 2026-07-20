"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetTrigger, SheetContent } from "@/components/ui/sheet";
import { SidebarNavContent } from "@/components/layout/sidebar-nav";
import type { Profile, WeddingEvent } from "@/lib/types";

export function MobileNav({ events, profile }: { events: WeddingEvent[]; profile: Profile | null }) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent className="p-0">
        <SidebarNavContent events={events} profile={profile} onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}

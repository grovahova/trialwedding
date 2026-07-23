"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarHeart,
  ListChecks,
  ListTodo,
  Newspaper,
  ShoppingBag,
  Wallet,
  Users,
  Building2,
  ClipboardCheck,
  Clock,
  Settings,
  Heart,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Profile, WeddingEvent } from "@/lib/types";
import { EVENT_GRADIENTS } from "@/lib/constants";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/my-tasks", label: "My Tasks", icon: ListTodo },
  { href: "/tasks", label: "All Tasks", icon: ListChecks },
  { href: "/itinerary", label: "Day-of Itinerary", icon: Clock },
  { href: "/digest", label: "Weekly Digest", icon: Newspaper },
  { href: "/bookings", label: "Vendor Bookings", icon: ClipboardCheck },
  { href: "/shopping", label: "Shopping", icon: ShoppingBag },
  { href: "/budget", label: "Budget", icon: Wallet },
  { href: "/guests", label: "Guests", icon: Users },
  { href: "/vendors", label: "Vendors", icon: Building2 },
];

export function SidebarNavContent({
  events,
  profile,
  onNavigate,
}: {
  events: WeddingEvent[];
  profile: Profile | null;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <>
      <div className="flex h-16 items-center gap-2 border-b border-border px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-emerald-700 to-gold-500 text-white">
          <Heart className="h-4 w-4" fill="currentColor" />
        </div>
        <span className="font-display text-base font-semibold">oneSIPisallittakes</span>
      </div>

      <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 py-4">
        <ul className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                    active && "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="mt-6 flex items-center justify-between px-3">
          <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <CalendarHeart className="h-3.5 w-3.5" /> Events
          </span>
        </div>
        <ul className="mt-2 flex flex-col gap-1">
          {events.map((event) => {
            const active = pathname === `/events/${event.id}`;
            return (
              <li key={event.id}>
                <Link
                  href={`/events/${event.id}`}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                    active && "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                  )}
                >
                  <span className={cn("h-2.5 w-2.5 rounded-full", EVENT_GRADIENTS[event.color_theme])} />
                  {event.name}
                </Link>
              </li>
            );
          })}
          <li>
            <Link
              href="/events"
              onClick={onNavigate}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-primary hover:bg-muted"
            >
              Manage events →
            </Link>
          </li>
        </ul>
      </nav>

      {profile?.role === "admin" && (
        <div className="border-t border-border p-3">
          <Link
            href="/settings"
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
              pathname === "/settings" && "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
            )}
          >
            <Settings className="h-4 w-4" />
            Settings
          </Link>
        </div>
      )}
    </>
  );
}

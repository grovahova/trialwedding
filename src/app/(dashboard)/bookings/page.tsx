import { createClient } from "@/lib/supabase/server";
import { BookingsBoard } from "@/components/bookings/bookings-board";
import type { VendorBooking, WeddingEvent, Profile } from "@/lib/types";

export default async function BookingsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: bookings }, { data: events }, { data: settings }, { data: profiles }] = await Promise.all([
    supabase
      .from("vendor_bookings")
      .select("*, event:events(id, name, color_theme)")
      .order("created_at", { ascending: true }),
    supabase.from("events").select("*").eq("status", "active").order("position"),
    supabase.from("wedding_settings").select("*").eq("id", 1).single(),
    supabase.from("profiles").select("*"),
  ]);

  const currentProfile = (profiles as Profile[] | null)?.find((p) => p.id === user?.id);
  if (!currentProfile) return null;

  return (
    <div className="flex flex-col gap-6">
      <div className="overflow-hidden rounded-2xl bg-emerald-gold p-6 text-white shadow-soft-lg sm:p-8">
        <p className="text-sm uppercase tracking-[0.2em] text-white/70">Vendor Bookings</p>
        <h1 className="mt-1 font-display text-3xl font-semibold">Critical Booking Tracker</h1>
        <p className="mt-2 max-w-xl text-sm text-white/80">
          Every vendor category, its booking status, and how urgently it needs your attention — based on typical
          lead times before {settings?.couple_names ?? "the wedding"}'s big day.
        </p>
      </div>

      <BookingsBoard
        initialBookings={(bookings as VendorBooking[]) ?? []}
        events={(events as WeddingEvent[]) ?? []}
        weddingDate={settings?.wedding_date ?? null}
        currentProfile={currentProfile}
      />
    </div>
  );
}

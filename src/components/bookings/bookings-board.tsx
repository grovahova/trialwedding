"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { BookingRow } from "@/components/bookings/booking-row";
import { AddBookingDialog } from "@/components/bookings/add-booking-dialog";
import { BookingDetailDialog } from "@/components/bookings/booking-detail-dialog";
import { BookingDashboardStats } from "@/components/bookings/booking-dashboard-stats";
import { UpcomingTrialsWidget } from "@/components/bookings/upcoming-trials-widget";
import { BOOKING_CATEGORIES } from "@/lib/bookings";
import type { VendorBooking, WeddingEvent, Profile } from "@/lib/types";

export function BookingsBoard({
  initialBookings,
  events,
  weddingDate,
  currentProfile,
}: {
  initialBookings: VendorBooking[];
  events: WeddingEvent[];
  weddingDate: string | null;
  currentProfile: Profile;
}) {
  const [bookings, setBookings] = useState(initialBookings);
  const [addOpen, setAddOpen] = useState(false);
  const [selected, setSelected] = useState<VendorBooking | null>(null);
  const isAdmin = currentProfile.role === "admin";

  const grouped = useMemo(() => {
    const map = new Map<string, VendorBooking[]>();
    for (const b of bookings) {
      if (!map.has(b.category)) map.set(b.category, []);
      map.get(b.category)!.push(b);
    }
    // sort category groups by the canonical BOOKING_CATEGORIES order, custom ones at the end
    const order = BOOKING_CATEGORIES.map((c) => c.name);
    return Array.from(map.entries()).sort((a, b) => {
      const ai = order.indexOf(a[0]);
      const bi = order.indexOf(b[0]);
      return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
    });
  }, [bookings]);

  return (
    <div className="flex flex-col gap-6">
      <BookingDashboardStats bookings={bookings} weddingDate={weddingDate} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <div className="flex justify-end">
            <Button variant="gold" onClick={() => setAddOpen(true)}>
              <Plus className="h-4 w-4" /> Add Booking
            </Button>
          </div>

          {grouped.map(([category, items], i) => (
            <motion.div
              key={category}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="flex flex-col gap-2"
            >
              <h3 className="px-1 text-sm font-semibold">{category}</h3>
              {items.map((b) => (
                <BookingRow key={b.id} booking={b} weddingDate={weddingDate} onClick={() => setSelected(b)} />
              ))}
            </motion.div>
          ))}
        </div>

        <div>
          <UpcomingTrialsWidget bookings={bookings} />
        </div>
      </div>

      <AddBookingDialog open={addOpen} onOpenChange={setAddOpen} events={events} />

      {selected && (
        <BookingDetailDialog
          booking={selected}
          events={events}
          canEdit={isAdmin}
          open={!!selected}
          onOpenChange={(open) => !open && setSelected(null)}
          onUpdated={(b) => {
            setBookings((prev) => prev.map((p) => (p.id === b.id ? b : p)));
            setSelected(b);
          }}
          onDeleted={(id) => {
            setBookings((prev) => prev.filter((p) => p.id !== id));
            setSelected(null);
          }}
        />
      )}
    </div>
  );
}

"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Clock, AlertTriangle, ClipboardList } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { BOOKING_URGENCY_STYLES, getBookingUrgency } from "@/lib/bookings";
import { cn } from "@/lib/utils";
import type { VendorBooking } from "@/lib/types";

export function BookingDashboardStats({ bookings, weddingDate }: { bookings: VendorBooking[]; weddingDate: string | null }) {
  const total = bookings.length;
  const confirmed = bookings.filter((b) => b.status === "confirmed" || b.status === "booked").length;
  const pending = bookings.filter((b) => !["confirmed", "booked", "cancelled"].includes(b.status)).length;
  const overdue = bookings.filter((b) => getBookingUrgency(b.category, weddingDate, b.status) === "overdue").length;
  const overallPct = total === 0 ? 0 : Math.round((confirmed / total) * 100);

  const byCategory = Object.values(
    bookings.reduce<Record<string, { category: string; items: VendorBooking[] }>>((acc, b) => {
      acc[b.category] ??= { category: b.category, items: [] };
      acc[b.category].items.push(b);
      return acc;
    }, {})
  );

  const stats = [
    { label: "Bookings Needed", value: total, icon: ClipboardList, tone: "text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300" },
    { label: "Confirmed", value: confirmed, icon: CheckCircle2, tone: "text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300" },
    { label: "Pending", value: pending, icon: Clock, tone: "text-amber-700 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-300" },
    { label: "Overdue", value: overdue, icon: AlertTriangle, tone: "text-red-700 bg-red-50 dark:bg-red-950/40 dark:text-red-300" },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-xl border border-border bg-card p-4 shadow-soft"
          >
            <div className={cn("mb-2 flex h-8 w-8 items-center justify-center rounded-full", s.tone)}>
              <s.icon className="h-4 w-4" />
            </div>
            <p className="font-display text-2xl font-semibold">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-display text-base font-semibold">Overall Booking Progress</h3>
          <span className="text-sm font-medium text-muted-foreground">{overallPct}%</span>
        </div>
        <Progress value={overallPct} />

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {byCategory.map(({ category, items }) => {
            const worst = items.reduce((acc, b) => {
              const u = getBookingUrgency(b.category, weddingDate, b.status);
              const order = ["overdue", "red", "orange", "yellow", "green", "done"];
              return order.indexOf(u) < order.indexOf(acc) ? u : acc;
            }, "done" as ReturnType<typeof getBookingUrgency>);
            const style = BOOKING_URGENCY_STYLES[worst];
            const done = items.some((b) => b.status === "confirmed" || b.status === "booked");

            return (
              <div key={category} className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm">
                <span className="truncate">{category}</span>
                <span className={cn("flex items-center gap-1.5 shrink-0 text-xs font-medium", style.text)}>
                  <span className={cn("h-1.5 w-1.5 rounded-full", style.dot)} />
                  {done ? "Booked" : style.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

"use client";

import { MessageCircle, FileCheck2, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { BOOKING_STATUS_STYLES, BOOKING_URGENCY_STYLES, getBookingUrgency, idealBookByDate } from "@/lib/bookings";
import { cn, formatCurrency, formatDate, whatsappLink } from "@/lib/utils";
import type { VendorBooking } from "@/lib/types";

export function BookingRow({
  booking,
  weddingDate,
  onClick,
}: {
  booking: VendorBooking;
  weddingDate: string | null;
  onClick: () => void;
}) {
  const urgency = getBookingUrgency(booking.category, weddingDate, booking.status);
  const urgencyStyle = BOOKING_URGENCY_STYLES[urgency];
  const balance = Number(booking.total_amount) - Number(booking.advance_paid);
  const isUnbooked = booking.status === "not_booked" || booking.status === "enquired" || booking.status === "negotiating";

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onClick()}
      className={cn(
        "flex w-full flex-wrap items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 text-left shadow-soft transition-all hover:shadow-soft-lg hover:-translate-y-0.5 cursor-pointer",
        "border-l-4",
        urgency === "overdue" && "border-l-red-600",
        urgency === "red" && "border-l-red-500",
        urgency === "orange" && "border-l-orange-500",
        urgency === "yellow" && "border-l-amber-400",
        urgency === "green" && "border-l-emerald-500",
        urgency === "done" && "border-l-emerald-600"
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold">{booking.vendor_name || "Not selected yet"}</p>
          {booking.contract_signed && (
            <span title="Contract signed">
              <FileCheck2 className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
            </span>
          )}
        </div>
        <p className="truncate text-xs text-muted-foreground">
          {booking.event?.name ?? "Whole wedding"}
          {isUnbooked && weddingDate && (
            <> · Ideally book by {formatDate(idealBookByDate(booking.category, weddingDate), "d MMM")}</>
          )}
        </p>
      </div>

      {booking.trial_scheduled_date && (
        <Badge variant="outline" className="flex items-center gap-1 text-[10px]">
          <Sparkles className="h-3 w-3" /> Trial {formatDate(booking.trial_scheduled_date, "d MMM")}
        </Badge>
      )}

      <div className="text-right text-xs">
        <p className={cn("font-medium", balance > 0 ? "text-amber-600" : "text-emerald-600")}>
          {booking.total_amount > 0 ? (balance > 0 ? `Due ${formatCurrency(balance)}` : "Fully paid") : "—"}
        </p>
      </div>

      <Badge variant="outline" className={BOOKING_STATUS_STYLES[booking.status].badge}>
        {BOOKING_STATUS_STYLES[booking.status].label}
      </Badge>

      {isUnbooked && (
        <span className={cn("flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold", urgencyStyle.text)}>
          <span className={cn("h-1.5 w-1.5 rounded-full", urgencyStyle.dot)} />
          {urgencyStyle.label}
        </span>
      )}

      {booking.contact_phone && (
        <a
          href={whatsappLink(booking.contact_phone, `Hi, following up on our ${booking.category} booking.`)}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-1 text-xs text-emerald-600 hover:underline"
        >
          <MessageCircle className="h-3.5 w-3.5" />
        </a>
      )}
    </div>
  );
}

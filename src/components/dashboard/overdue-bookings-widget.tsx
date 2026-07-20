import Link from "next/link";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getBookingUrgency, idealBookByDate } from "@/lib/bookings";
import { formatDate } from "@/lib/utils";
import type { VendorBooking } from "@/lib/types";

export function OverdueBookingsWidget({ bookings, weddingDate }: { bookings: VendorBooking[]; weddingDate: string | null }) {
  const overdue = bookings.filter((b) => getBookingUrgency(b.category, weddingDate, b.status) === "overdue");

  return (
    <Card className={overdue.length > 0 ? "border-red-200" : undefined}>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2 text-base text-red-700 dark:text-red-400">
          <AlertTriangle className="h-4 w-4" />
          Overdue Bookings
        </CardTitle>
        <Link href="/bookings" className="text-xs font-medium text-primary hover:underline">
          View tracker
        </Link>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {overdue.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-6 text-center text-sm text-muted-foreground">
            <CheckCircle2 className="h-6 w-6 text-emerald-400" />
            No overdue vendor bookings — you're ahead of schedule!
          </div>
        )}
        {overdue.map((b) => (
          <Link
            key={b.id}
            href="/bookings"
            className="flex items-center justify-between gap-2 rounded-lg border border-red-200 bg-red-50/60 px-3 py-2.5 text-sm dark:border-red-900/40 dark:bg-red-950/20"
          >
            <div className="min-w-0">
              <p className="truncate font-medium">{b.category}</p>
              {weddingDate && (
                <p className="truncate text-xs text-red-600">
                  Ideal book-by was {formatDate(idealBookByDate(b.category, weddingDate), "d MMM")}
                </p>
              )}
            </div>
            <span className="shrink-0 rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-semibold text-white">
              Not booked
            </span>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}

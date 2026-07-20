import { Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate, daysUntil } from "@/lib/utils";
import type { VendorBooking } from "@/lib/types";

type TrialEntry = { booking: VendorBooking; label: string; date: string };

export function UpcomingTrialsWidget({ bookings }: { bookings: VendorBooking[] }) {
  const entries: TrialEntry[] = [];

  for (const b of bookings) {
    if (b.trial_scheduled_date) {
      entries.push({ booking: b, label: `${b.category} trial`, date: b.trial_scheduled_date });
    }
    for (const fitting of b.fitting_dates ?? []) {
      entries.push({ booking: b, label: `${b.category} fitting`, date: fitting });
    }
  }

  const upcoming = entries
    .filter((e) => daysUntil(e.date) >= -1 && daysUntil(e.date) <= 45)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="h-4 w-4 text-gold-600" />
          Upcoming Trials &amp; Fittings
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {upcoming.length === 0 && (
          <p className="py-4 text-center text-sm text-muted-foreground">Nothing scheduled in the next 45 days.</p>
        )}
        {upcoming.map((e, i) => (
          <div key={i} className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm">
            <div>
              <p className="font-medium">{e.label}</p>
              <p className="text-xs text-muted-foreground">{e.booking.vendor_name || "Vendor TBD"}</p>
            </div>
            <Badge variant="outline">{formatDate(e.date, "d MMM")}</Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

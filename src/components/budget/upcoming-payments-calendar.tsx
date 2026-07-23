import Link from "next/link";
import { CalendarClock, Wallet, Sparkles, Shirt } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn, daysUntil, formatCurrency, formatDate } from "@/lib/utils";
import type { BudgetItem, VendorBooking } from "@/lib/types";

type CalendarEntry = {
  id: string;
  kind: "payment" | "trial" | "fitting";
  label: string;
  sublabel?: string;
  date: string;
  href: string;
};

const KIND_META = {
  payment: { icon: Wallet, label: "Payment" },
  trial: { icon: Sparkles, label: "Trial" },
  fitting: { icon: Shirt, label: "Fitting" },
};

function urgencyStyle(days: number) {
  if (days < 0) return "border-l-red-600 bg-red-50/60 dark:bg-red-950/20";
  if (days <= 7) return "border-l-red-500";
  if (days <= 14) return "border-l-orange-500";
  if (days <= 30) return "border-l-amber-400";
  return "border-l-emerald-500";
}

export function UpcomingPaymentsCalendar({
  budgetItems,
  bookings,
}: {
  budgetItems: BudgetItem[];
  bookings: VendorBooking[];
}) {
  const entries: CalendarEntry[] = [];

  for (const b of budgetItems) {
    if (b.due_date && b.payment_status !== "paid") {
      entries.push({
        id: `budget-${b.id}`,
        kind: "payment",
        label: b.item_name,
        sublabel: formatCurrency(Number(b.planned_amount)),
        date: b.due_date,
        href: "/budget",
      });
    }
  }

  for (const vb of bookings) {
    if (vb.final_payment_due_date) {
      const balance = Number(vb.total_amount) - Number(vb.advance_paid);
      entries.push({
        id: `booking-pay-${vb.id}`,
        kind: "payment",
        label: `${vb.vendor_name || vb.category} — balance`,
        sublabel: balance > 0 ? formatCurrency(balance) : "Fully paid",
        date: vb.final_payment_due_date,
        href: "/bookings",
      });
    }
    if (vb.trial_scheduled_date) {
      entries.push({
        id: `booking-trial-${vb.id}`,
        kind: "trial",
        label: `${vb.category} trial`,
        sublabel: vb.vendor_name || undefined,
        date: vb.trial_scheduled_date,
        href: "/bookings",
      });
    }
    for (const fitting of vb.fitting_dates ?? []) {
      entries.push({
        id: `booking-fitting-${vb.id}-${fitting}`,
        kind: "fitting",
        label: `${vb.category} fitting`,
        sublabel: vb.vendor_name || undefined,
        date: fitting,
        href: "/bookings",
      });
    }
  }

  const sorted = entries
    .filter((e) => daysUntil(e.date) <= 60)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarClock className="h-4 w-4 text-primary" />
          Upcoming Payments &amp; Trials
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {sorted.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">Nothing due in the next 60 days.</p>
        )}
        {sorted.map((entry) => {
          const days = daysUntil(entry.date);
          const Icon = KIND_META[entry.kind].icon;
          return (
            <Link
              key={entry.id}
              href={entry.href}
              className={cn(
                "flex items-center gap-3 rounded-lg border border-border border-l-4 bg-card px-3 py-2.5 text-sm transition-shadow hover:shadow-soft",
                urgencyStyle(days)
              )}
            >
              <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{entry.label}</p>
                {entry.sublabel && <p className="truncate text-xs text-muted-foreground">{entry.sublabel}</p>}
              </div>
              <div className="text-right">
                <Badge variant="outline" className="mb-1 text-[10px]">{KIND_META[entry.kind].label}</Badge>
                <p className={cn("text-xs font-medium", days < 0 ? "text-red-600" : days <= 14 ? "text-orange-600" : "text-muted-foreground")}>
                  {days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? "Today" : `in ${days}d`} · {formatDate(entry.date, "d MMM")}
                </p>
              </div>
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}

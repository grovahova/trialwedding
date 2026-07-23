"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AddBudgetItemDialog } from "@/components/budget/add-budget-item-dialog";
import { BudgetChart } from "@/components/budget/budget-chart";
import { BudgetSpendPieChart } from "@/components/budget/budget-spend-pie-chart";
import { UpcomingPaymentsCalendar } from "@/components/budget/upcoming-payments-calendar";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { BudgetItem, WeddingEvent, Vendor, VendorBooking } from "@/lib/types";

const PAYMENT_BADGE: Record<string, string> = {
  unpaid: "bg-red-50 text-red-700 border-red-200",
  advance_paid: "bg-amber-50 text-amber-700 border-amber-200",
  paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

export function BudgetTable({
  items,
  events,
  vendors,
  bookings,
  defaultEventId,
}: {
  items: BudgetItem[];
  events: WeddingEvent[];
  vendors: Vendor[];
  bookings: VendorBooking[];
  defaultEventId?: string;
}) {
  const [open, setOpen] = useState(false);
  const totalPlanned = items.reduce((s, i) => s + Number(i.planned_amount), 0);
  const totalActual = items.reduce((s, i) => s + Number(i.actual_amount), 0);
  const remaining = totalPlanned - totalActual;

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4 shadow-soft">
          <p className="text-xs font-medium text-muted-foreground">Total Planned</p>
          <p className="mt-1 font-display text-2xl font-semibold">{formatCurrency(totalPlanned)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-soft">
          <p className="text-xs font-medium text-muted-foreground">Total Spent</p>
          <p className="mt-1 font-display text-2xl font-semibold">{formatCurrency(totalActual)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-soft">
          <p className="text-xs font-medium text-muted-foreground">Remaining</p>
          <p className={`mt-1 font-display text-2xl font-semibold ${remaining < 0 ? "text-red-600" : ""}`}>
            {formatCurrency(remaining)}
          </p>
        </div>
      </div>

      <UpcomingPaymentsCalendar budgetItems={items} bookings={bookings} />

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Spend Analysis</h2>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <BudgetChart items={items} />
          <BudgetSpendPieChart items={items} />
        </div>
      </div>

      <div className="flex justify-end">
        <Button variant="gold" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" /> Add Line
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Item</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Planned</th>
              <th className="px-4 py-3 font-medium">Actual</th>
              <th className="px-4 py-3 font-medium">Due</th>
              <th className="px-4 py-3 font-medium">Payment</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {items.map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-3 font-medium">{item.item_name}</td>
                <td className="px-4 py-3 text-muted-foreground">{item.category}</td>
                <td className="px-4 py-3">{formatCurrency(Number(item.planned_amount))}</td>
                <td className="px-4 py-3">{formatCurrency(Number(item.actual_amount))}</td>
                <td className="px-4 py-3 text-muted-foreground">{item.due_date ? formatDate(item.due_date) : "—"}</td>
                <td className="px-4 py-3">
                  <Badge variant="outline" className={PAYMENT_BADGE[item.payment_status]}>
                    {item.payment_status.replace("_", " ")}
                  </Badge>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                  No budget lines yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <AddBudgetItemDialog open={open} onOpenChange={setOpen} events={events} vendors={vendors} defaultEventId={defaultEventId} />
    </div>
  );
}

"use client";

import { useState } from "react";
import { Plus, Star, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AddVendorDialog } from "@/components/vendors/add-vendor-dialog";
import { formatCurrency, whatsappLink, cn } from "@/lib/utils";
import type { Vendor, WeddingEvent } from "@/lib/types";

export function VendorsTable({ vendors, events }: { vendors: Vendor[]; events: WeddingEvent[] }) {
  const [open, setOpen] = useState(false);
  const byCategory = vendors.reduce<Record<string, Vendor[]>>((acc, v) => {
    acc[v.category] ??= [];
    acc[v.category].push(v);
    return acc;
  }, {});

  return (
    <div className="flex flex-col gap-5">
      <div className="flex justify-end">
        <Button variant="gold" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" /> Add Vendor
        </Button>
      </div>

      {Object.entries(byCategory).map(([category, catVendors]) => (
        <div key={category} className="rounded-xl border border-border">
          <div className="border-b border-border bg-muted/50 px-4 py-2.5">
            <h3 className="text-sm font-semibold">{category}</h3>
          </div>
          <div className="divide-y divide-border">
            {catVendors.map((v) => {
              const balance = Number(v.total_amount) - Number(v.advance_paid);
              return (
                <div key={v.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{v.name}</p>
                    {v.notes && <p className="truncate text-xs text-muted-foreground">{v.notes}</p>}
                  </div>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          "h-3.5 w-3.5",
                          v.rating && i < v.rating ? "fill-gold-500 text-gold-500" : "text-muted-foreground/30"
                        )}
                      />
                    ))}
                  </div>
                  <div className="text-right text-sm">
                    <p className="font-medium">{formatCurrency(Number(v.total_amount))}</p>
                    <p className={cn("text-xs", balance > 0 ? "text-amber-600" : "text-emerald-600")}>
                      {balance > 0 ? `Balance ${formatCurrency(balance)}` : "Fully paid"}
                    </p>
                  </div>
                  {v.phone && (
                    <a
                      href={whatsappLink(v.phone, `Hi ${v.name}, checking in about our booking.`)}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 text-sm text-emerald-600 hover:underline"
                    >
                      <MessageCircle className="h-3.5 w-3.5" /> Contact
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {vendors.length === 0 && (
        <div className="rounded-xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
          No vendors yet. Add your first booking above.
        </div>
      )}

      <AddVendorDialog open={open} onOpenChange={setOpen} events={events} />
    </div>
  );
}

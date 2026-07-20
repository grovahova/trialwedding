"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BOOKING_CATEGORIES } from "@/lib/bookings";
import { toast } from "sonner";
import type { WeddingEvent } from "@/lib/types";
import { getErrorMessage } from "@/lib/utils";

export function AddBookingDialog({
  open,
  onOpenChange,
  events,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  events: WeddingEvent[];
}) {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    category: BOOKING_CATEGORIES[0].name,
    customCategory: "",
    vendorName: "",
    eventId: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const category = form.category === "Others" && form.customCategory.trim() ? form.customCategory.trim() : form.category;
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const { error } = await supabase.from("vendor_bookings").insert({
        category,
        vendor_name: form.vendorName || null,
        event_id: form.eventId || null,
        created_by: user?.id,
      });
      if (error) throw error;
      toast.success("Booking added");
      onOpenChange(false);
      setForm({ category: BOOKING_CATEGORIES[0].name, customCategory: "", vendorName: "", eventId: "" });
      router.refresh();
    } catch (err: any) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a booking</DialogTitle>
          <DialogDescription>Track a new vendor category or a second vendor for the same category.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Category</Label>
            <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {BOOKING_CATEGORIES.map((c) => (
                  <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {form.category === "Others" && (
            <div className="flex flex-col gap-1.5">
              <Label>Custom category name</Label>
              <Input
                value={form.customCategory}
                onChange={(e) => setForm({ ...form, customCategory: e.target.value })}
                placeholder="e.g. Fireworks"
              />
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <Label>Vendor name (optional for now)</Label>
            <Input value={form.vendorName} onChange={(e) => setForm({ ...form, vendorName: e.target.value })} placeholder="Studio Lumière" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Wedding function</Label>
            <Select value={form.eventId} onValueChange={(v) => setForm({ ...form, eventId: v })}>
              <SelectTrigger><SelectValue placeholder="Applies to whole wedding" /></SelectTrigger>
              <SelectContent>
                {events.map((ev) => <SelectItem key={ev.id} value={ev.id}>{ev.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" variant="gold" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Add booking
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

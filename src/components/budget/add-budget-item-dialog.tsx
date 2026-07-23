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
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import type { WeddingEvent, Vendor, PaymentStatus } from "@/lib/types";
import { getErrorMessage } from "@/lib/utils";

export function AddBudgetItemDialog({
  open,
  onOpenChange,
  events,
  vendors,
  defaultEventId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  events: WeddingEvent[];
  vendors: Vendor[];
  defaultEventId?: string;
}) {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    itemName: "",
    category: "",
    eventId: defaultEventId ?? events[0]?.id ?? "",
    planned: "",
    actual: "",
    dueDate: "",
    vendorId: "",
    paymentStatus: "unpaid" as PaymentStatus,
    notes: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.itemName.trim()) return;
    setLoading(true);
    try {
      const { error } = await supabase.from("budget_items").insert({
        item_name: form.itemName,
        category: form.category || "General",
        event_id: form.eventId || null,
        planned_amount: Number(form.planned) || 0,
        actual_amount: Number(form.actual) || 0,
        due_date: form.dueDate || null,
        vendor_id: form.vendorId || null,
        payment_status: form.paymentStatus,
        notes: form.notes || null,
      });
      if (error) throw error;
      toast.success("Budget item added");
      onOpenChange(false);
      setForm({ ...form, itemName: "", planned: "", actual: "", dueDate: "", notes: "" });
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
          <DialogTitle>Add budget line</DialogTitle>
          <DialogDescription>Track planned vs. actual spend for every expense.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Item</Label>
              <Input required value={form.itemName} onChange={(e) => setForm({ ...form, itemName: e.target.value })} placeholder="Catering advance" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Category</Label>
              <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Catering" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Event</Label>
              <Select value={form.eventId} onValueChange={(v) => setForm({ ...form, eventId: v })}>
                <SelectTrigger><SelectValue placeholder="Select event" /></SelectTrigger>
                <SelectContent>
                  {events.map((ev) => <SelectItem key={ev.id} value={ev.id}>{ev.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Vendor</Label>
              <Select value={form.vendorId} onValueChange={(v) => setForm({ ...form, vendorId: v })}>
                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  {vendors.map((v) => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Planned (₹)</Label>
              <Input type="number" min={0} value={form.planned} onChange={(e) => setForm({ ...form, planned: e.target.value })} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Actual (₹)</Label>
              <Input type="number" min={0} value={form.actual} onChange={(e) => setForm({ ...form, actual: e.target.value })} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Payment</Label>
              <Select value={form.paymentStatus} onValueChange={(v) => setForm({ ...form, paymentStatus: v as PaymentStatus })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="unpaid">Unpaid</SelectItem>
                  <SelectItem value="advance_paid">Advance Paid</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Payment due date</Label>
            <Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
            <p className="text-xs text-muted-foreground">Shows on the payment calendar — you'll get a reminder 2 weeks before.</p>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Notes</Label>
            <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" variant="gold" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Add line
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

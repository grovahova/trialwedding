"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2, Plus, X, Upload, FileText, MessageCircle } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BOOKING_STATUS_STYLES } from "@/lib/bookings";
import { formatCurrency, getErrorMessage, whatsappLink } from "@/lib/utils";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import type { VendorBooking, BookingStatus, WeddingEvent } from "@/lib/types";

const TRIAL_LABELS: Record<string, string> = {
  "Makeup Artist": "Trial makeup date",
  "Wedding Clothes / Tailor": "First fitting date",
  "Food Catering": "Tasting date",
};

export function BookingDetailDialog({
  booking,
  events,
  canEdit,
  open,
  onOpenChange,
  onUpdated,
  onDeleted,
}: {
  booking: VendorBooking;
  events: WeddingEvent[];
  canEdit: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: (b: VendorBooking) => void;
  onDeleted: (id: string) => void;
}) {
  const supabase = createClient();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newFittingDate, setNewFittingDate] = useState("");
  const [form, setForm] = useState({
    vendorName: booking.vendor_name ?? "",
    eventId: booking.event_id ?? "",
    status: booking.status,
    bookingDate: booking.booking_date ?? "",
    contractSigned: booking.contract_signed,
    advancePaid: String(booking.advance_paid ?? 0),
    totalAmount: String(booking.total_amount ?? 0),
    finalPaymentDueDate: booking.final_payment_due_date ?? "",
    contactPerson: booking.contact_person ?? "",
    contactPhone: booking.contact_phone ?? "",
    trialDate: booking.trial_scheduled_date ?? "",
    fittingDates: booking.fitting_dates ?? [],
    notes: booking.notes ?? "",
  });

  const balanceDue = (Number(form.totalAmount) || 0) - (Number(form.advancePaid) || 0);
  const trialLabel = TRIAL_LABELS[booking.category] ?? "Trial / sample scheduled";

  async function save(partial?: Record<string, any>) {
    setSaving(true);
    const payload = partial ?? {
      vendor_name: form.vendorName || null,
      event_id: form.eventId || null,
      status: form.status,
      booking_date: form.bookingDate || null,
      contract_signed: form.contractSigned,
      advance_paid: Number(form.advancePaid) || 0,
      total_amount: Number(form.totalAmount) || 0,
      final_payment_due_date: form.finalPaymentDueDate || null,
      contact_person: form.contactPerson || null,
      contact_phone: form.contactPhone || null,
      trial_scheduled_date: form.trialDate || null,
      fitting_dates: form.fittingDates,
      notes: form.notes || null,
    };
    const { data, error } = await supabase.from("vendor_bookings").update(payload).eq("id", booking.id).select().single();
    setSaving(false);
    if (error) {
      toast.error("Could not save booking");
      return;
    }
    if (payload.status === "confirmed" && booking.status !== "confirmed") {
      confetti({ particleCount: 100, spread: 75, origin: { y: 0.6 }, colors: ["#187d5c", "#dba93a", "#f5ebc9"] });
      toast.success(`${booking.category} confirmed! 🎉`);
    }
    onUpdated({ ...booking, ...data });
    router.refresh();
  }

  function addFittingDate() {
    if (!newFittingDate) return;
    setForm((f) => ({ ...f, fittingDates: [...f.fittingDates, newFittingDate].sort() }));
    setNewFittingDate("");
  }

  function removeFittingDate(date: string) {
    setForm((f) => ({ ...f, fittingDates: f.fittingDates.filter((d) => d !== date) }));
  }

  async function uploadContract(file: File) {
    setUploading(true);
    try {
      const path = `${booking.id}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from("contracts").upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { error } = await supabase.from("vendor_bookings").update({ contract_url: path }).eq("id", booking.id);
      if (error) throw error;
      toast.success("Contract uploaded");
      onUpdated({ ...booking, contract_url: path });
      router.refresh();
    } catch (err: any) {
      toast.error(getErrorMessage(err));
    } finally {
      setUploading(false);
    }
  }

  async function viewContract() {
    if (!booking.contract_url) return;
    const { data, error } = await supabase.storage.from("contracts").createSignedUrl(booking.contract_url, 60);
    if (error || !data) return toast.error("Could not open contract");
    window.open(data.signedUrl, "_blank");
  }

  async function deleteBooking() {
    if (!confirm(`Remove the ${booking.category} booking record? This cannot be undone.`)) return;
    const { error } = await supabase.from("vendor_bookings").delete().eq("id", booking.id);
    if (error) return toast.error("Could not delete booking");
    toast.success("Booking removed");
    onDeleted(booking.id);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <Badge variant="outline" className="w-fit">{booking.category}</Badge>
          <DialogTitle>{form.vendorName || `${booking.category} — not booked yet`}</DialogTitle>
          <DialogDescription>Track this vendor's booking status, payments, and key dates.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label>Vendor name</Label>
            <Input disabled={!canEdit} value={form.vendorName} onChange={(e) => setForm({ ...form, vendorName: e.target.value })} placeholder="Not selected yet" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Wedding function</Label>
            <Select disabled={!canEdit} value={form.eventId} onValueChange={(v) => setForm({ ...form, eventId: v })}>
              <SelectTrigger><SelectValue placeholder="Whole wedding" /></SelectTrigger>
              <SelectContent>
                {events.map((ev) => <SelectItem key={ev.id} value={ev.id}>{ev.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label>Booking status</Label>
            <Select disabled={!canEdit} value={form.status} onValueChange={(v) => setForm({ ...form, status: v as BookingStatus })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(BOOKING_STATUS_STYLES).map(([value, s]) => (
                  <SelectItem key={value} value={value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Booking date</Label>
            <Input disabled={!canEdit} type="date" value={form.bookingDate} onChange={(e) => setForm({ ...form, bookingDate: e.target.value })} />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Checkbox disabled={!canEdit} checked={form.contractSigned} onCheckedChange={(c) => setForm({ ...form, contractSigned: c === true })} />
          <Label className="!mt-0">Contract signed</Label>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-1.5">
            <Label>Advance paid (₹)</Label>
            <Input disabled={!canEdit} type="number" min={0} value={form.advancePaid} onChange={(e) => setForm({ ...form, advancePaid: e.target.value })} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Total amount (₹)</Label>
            <Input disabled={!canEdit} type="number" min={0} value={form.totalAmount} onChange={(e) => setForm({ ...form, totalAmount: e.target.value })} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Balance due</Label>
            <div className={`flex h-10 items-center rounded-md border border-border px-3 text-sm font-medium ${balanceDue > 0 ? "text-red-600" : "text-emerald-600"}`}>
              {formatCurrency(balanceDue)}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Final payment due date</Label>
          <Input disabled={!canEdit} type="date" value={form.finalPaymentDueDate} onChange={(e) => setForm({ ...form, finalPaymentDueDate: e.target.value })} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label>Contact person</Label>
            <Input disabled={!canEdit} value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Contact phone</Label>
            <div className="flex gap-2">
              <Input disabled={!canEdit} value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} placeholder="+91 98765 43210" />
              {form.contactPhone && (
                <a href={whatsappLink(form.contactPhone, `Hi, following up on our ${booking.category} booking.`)} target="_blank" rel="noreferrer">
                  <Button type="button" variant="outline" size="icon"><MessageCircle className="h-4 w-4" /></Button>
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>{trialLabel}</Label>
          <Input disabled={!canEdit} type="date" value={form.trialDate} onChange={(e) => setForm({ ...form, trialDate: e.target.value })} />
        </div>

        {booking.category === "Wedding Clothes / Tailor" && (
          <div className="flex flex-col gap-2">
            <Label>Fitting dates</Label>
            <div className="flex flex-wrap gap-2">
              {form.fittingDates.map((d) => (
                <Badge key={d} variant="outline" className="flex items-center gap-1.5">
                  {d}
                  {canEdit && (
                    <button type="button" onClick={() => removeFittingDate(d)}>
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </Badge>
              ))}
            </div>
            {canEdit && (
              <div className="flex gap-2">
                <Input type="date" value={newFittingDate} onChange={(e) => setNewFittingDate(e.target.value)} />
                <Button type="button" variant="outline" size="icon" onClick={addFittingDate}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <Label>Notes</Label>
          <Textarea disabled={!canEdit} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Contract</Label>
          {booking.contract_url ? (
            <button type="button" onClick={viewContract} className="flex w-fit items-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:bg-muted">
              <FileText className="h-4 w-4" /> View uploaded contract
            </button>
          ) : (
            <p className="text-xs text-muted-foreground">No contract uploaded yet.</p>
          )}
          {canEdit && (
            <label className="flex w-fit cursor-pointer items-center gap-2 rounded-md border border-dashed border-border px-3 py-2 text-sm text-muted-foreground hover:bg-muted">
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {uploading ? "Uploading…" : "Upload contract (PDF/image)"}
              <input
                type="file"
                accept="application/pdf,image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && uploadContract(e.target.files[0])}
              />
            </label>
          )}
        </div>

        <DialogFooter className="justify-between sm:justify-between">
          {canEdit ? (
            <Button type="button" variant="ghost" className="text-destructive" onClick={deleteBooking}>
              <Trash2 className="h-4 w-4" /> Remove booking
            </Button>
          ) : <span />}
          {canEdit && (
            <Button type="button" variant="gold" disabled={saving} onClick={() => save()}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Save changes
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

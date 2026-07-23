"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
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
import { getErrorMessage } from "@/lib/utils";
import { toast } from "sonner";
import type { ItineraryItem, WeddingEvent } from "@/lib/types";

export function ItineraryItemDialog({
  item,
  events,
  defaultDate,
  open,
  onOpenChange,
}: {
  item: ItineraryItem | null;
  events: WeddingEvent[];
  defaultDate?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: item?.title ?? "",
    itemDate: item?.item_date ?? defaultDate ?? "",
    startTime: item?.start_time ?? "",
    endTime: item?.end_time ?? "",
    track: item?.track ?? "general",
    location: item?.location ?? "",
    responsibleParty: item?.responsible_party ?? "",
    eventId: item?.event_id ?? "",
    notes: item?.notes ?? "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;
    setLoading(true);
    try {
      const payload = {
        title: form.title,
        item_date: form.itemDate || null,
        start_time: form.startTime || null,
        end_time: form.endTime || null,
        track: form.track,
        location: form.location || null,
        responsible_party: form.responsibleParty || null,
        event_id: form.eventId || null,
        notes: form.notes || null,
      };

      if (item) {
        const { error } = await supabase.from("itinerary_items").update(payload).eq("id", item.id);
        if (error) throw error;
        toast.success("Itinerary item updated");
      } else {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        const { error } = await supabase.from("itinerary_items").insert({ ...payload, created_by: user?.id });
        if (error) throw error;
        toast.success("Itinerary item added");
      }
      onOpenChange(false);
      router.refresh();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!item) return;
    if (!confirm(`Remove "${item.title}" from the itinerary?`)) return;
    const { error } = await supabase.from("itinerary_items").delete().eq("id", item.id);
    if (error) return toast.error(getErrorMessage(error));
    toast.success("Removed");
    onOpenChange(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{item ? "Edit itinerary item" : "Add itinerary item"}</DialogTitle>
          <DialogDescription>Part of the day-of run of show — what's happening, when, and who owns it.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Title</Label>
            <Input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Baraat" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Date</Label>
              <Input type="date" value={form.itemDate} onChange={(e) => setForm({ ...form, itemDate: e.target.value })} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Start</Label>
              <Input value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} placeholder="2PM" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>End</Label>
              <Input value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} placeholder="3PM" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Track</Label>
              <Select value={form.track} onValueChange={(v) => setForm({ ...form, track: v as ItineraryItem["track"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="guests">Guests</SelectItem>
                  <SelectItem value="bride_groom">Bride &amp; Groom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Event</Label>
              <Select value={form.eventId} onValueChange={(v) => setForm({ ...form, eventId: v })}>
                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  {events.map((ev) => <SelectItem key={ev.id} value={ev.id}>{ev.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Location</Label>
              <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Nameri Lawn" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Responsible party</Label>
              <Input value={form.responsibleParty} onChange={(e) => setForm({ ...form, responsibleParty: e.target.value })} placeholder="Wedding planner" />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Notes / requirements</Label>
            <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          <DialogFooter className="justify-between sm:justify-between">
            {item ? (
              <Button type="button" variant="ghost" className="text-destructive" onClick={handleDelete}>
                <Trash2 className="h-4 w-4" /> Remove
              </Button>
            ) : <span />}
            <Button type="submit" variant="gold" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {item ? "Save changes" : "Add item"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

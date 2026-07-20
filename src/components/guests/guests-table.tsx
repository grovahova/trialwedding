"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, MessageCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AddGuestDialog } from "@/components/guests/add-guest-dialog";
import { whatsappLink } from "@/lib/utils";
import type { Guest, RsvpStatus } from "@/lib/types";

const RSVP_BADGE: Record<RsvpStatus, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  confirmed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  declined: "bg-red-50 text-red-700 border-red-200",
  no_response: "bg-gray-100 text-gray-500 border-gray-200",
};

export function GuestsTable({ guests }: { guests: Guest[] }) {
  const supabase = createClient();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [sideFilter, setSideFilter] = useState("all");
  const [rsvpFilter, setRsvpFilter] = useState("all");

  const filtered = useMemo(() => {
    return guests.filter((g) => {
      if (search && !g.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (sideFilter !== "all" && g.side !== sideFilter) return false;
      if (rsvpFilter !== "all" && g.rsvp_status !== rsvpFilter) return false;
      return true;
    });
  }, [guests, search, sideFilter, rsvpFilter]);

  const totalGuests = guests.reduce((s, g) => s + 1 + g.plus_ones, 0);
  const confirmed = guests.filter((g) => g.rsvp_status === "confirmed").length;
  const invitationsSent = guests.filter((g) => g.invitation_sent).length;

  async function toggleInvitationSent(guest: Guest) {
    await supabase.from("guests").update({ invitation_sent: !guest.invitation_sent }).eq("id", guest.id);
    router.refresh();
  }

  async function updateRsvp(guest: Guest, status: RsvpStatus) {
    await supabase.from("guests").update({ rsvp_status: status }).eq("id", guest.id);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4 shadow-soft">
          <p className="text-xs font-medium text-muted-foreground">Total Guests (incl. plus-ones)</p>
          <p className="mt-1 font-display text-2xl font-semibold">{totalGuests}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-soft">
          <p className="text-xs font-medium text-muted-foreground">Confirmed</p>
          <p className="mt-1 font-display text-2xl font-semibold">{confirmed}/{guests.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-soft">
          <p className="text-xs font-medium text-muted-foreground">Invitations Sent</p>
          <p className="mt-1 font-display text-2xl font-semibold">{invitationsSent}/{guests.length}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search guests…" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={sideFilter} onValueChange={setSideFilter}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Side" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All sides</SelectItem>
            <SelectItem value="bride">Bride's side</SelectItem>
            <SelectItem value="groom">Groom's side</SelectItem>
            <SelectItem value="both">Both</SelectItem>
          </SelectContent>
        </Select>
        <Select value={rsvpFilter} onValueChange={setRsvpFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="RSVP" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All RSVP</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="declined">Declined</SelectItem>
            <SelectItem value="no_response">No response</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="gold" className="ml-auto" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" /> Add Guest
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Side / Group</th>
              <th className="px-4 py-3 font-medium">RSVP</th>
              <th className="px-4 py-3 font-medium">Invited</th>
              <th className="px-4 py-3 font-medium">Food</th>
              <th className="px-4 py-3 font-medium">Contact</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((g) => (
              <tr key={g.id}>
                <td className="px-4 py-3 font-medium">
                  {g.name}
                  {g.plus_ones > 0 && <span className="ml-1 text-xs text-muted-foreground">+{g.plus_ones}</span>}
                </td>
                <td className="px-4 py-3 text-muted-foreground capitalize">{g.side} · {g.guest_group}</td>
                <td className="px-4 py-3">
                  <Select value={g.rsvp_status} onValueChange={(v) => updateRsvp(g, v as RsvpStatus)}>
                    <SelectTrigger className="h-7 w-32 text-xs">
                      <Badge variant="outline" className={RSVP_BADGE[g.rsvp_status]}>
                        {g.rsvp_status.replace("_", " ")}
                      </Badge>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="declined">Declined</SelectItem>
                      <SelectItem value="no_response">No response</SelectItem>
                    </SelectContent>
                  </Select>
                </td>
                <td className="px-4 py-3">
                  <Checkbox checked={g.invitation_sent} onCheckedChange={() => toggleInvitationSent(g)} />
                </td>
                <td className="px-4 py-3 text-muted-foreground">{g.food_preference ?? "—"}</td>
                <td className="px-4 py-3">
                  {g.phone && (
                    <a
                      href={whatsappLink(g.phone, `Hi ${g.name}! Looking forward to celebrating with you 💛`)}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 text-emerald-600 hover:underline"
                    >
                      <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                    </a>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                  No guests match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <AddGuestDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}

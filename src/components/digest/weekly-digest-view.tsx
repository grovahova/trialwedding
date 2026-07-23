"use client";

import { useState } from "react";
import { CheckCircle2, CalendarClock, AlertTriangle, Sparkles, Share2, Copy, ClipboardCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { buildDigest, buildDigestText } from "@/lib/digest";
import { formatDate, whatsappShareLink } from "@/lib/utils";
import { toast } from "sonner";
import type { Task, VendorBooking } from "@/lib/types";

export function WeeklyDigestView({
  tasks,
  bookings,
  weddingDate,
  coupleNames,
}: {
  tasks: Task[];
  bookings: VendorBooking[];
  weddingDate: string | null;
  coupleNames: string;
}) {
  const [copied, setCopied] = useState(false);
  const digest = buildDigest(tasks, bookings, weddingDate);
  const text = buildDigestText(digest, coupleNames);

  async function copyText() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="overflow-hidden rounded-2xl bg-emerald-gold p-6 text-white shadow-soft-lg sm:p-8">
        <p className="text-sm uppercase tracking-[0.2em] text-white/70">Weekly Digest</p>
        <h1 className="mt-1 font-display text-3xl font-semibold">
          {formatDate(digest.weekStart, "d MMM")} – {formatDate(digest.weekEnd, "d MMM")}
        </h1>
        <p className="mt-2 max-w-xl text-sm text-white/80">
          A quick recap of this week's progress — share it with the family group in one tap.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <a href={whatsappShareLink(text)} target="_blank" rel="noreferrer">
            <Button variant="gold" className="bg-white text-emerald-800 hover:bg-white/90">
              <Share2 className="h-4 w-4" /> Share via WhatsApp
            </Button>
          </a>
          <Button variant="outline" className="border-white/40 bg-white/10 text-white hover:bg-white/20" onClick={copyText}>
            {copied ? <ClipboardCheck className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied" : "Copy text"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" /> Completed this week ({digest.completedThisWeek.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {digest.completedThisWeek.length === 0 && <p className="text-sm text-muted-foreground">Nothing marked complete yet — the week's still young.</p>}
            {digest.completedThisWeek.map((t) => (
              <div key={t.id} className="rounded-lg border border-emerald-200 bg-emerald-50/60 px-3 py-2 text-sm dark:border-emerald-900/40 dark:bg-emerald-950/20">
                {t.name}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarClock className="h-4 w-4 text-primary" /> Due this week ({digest.dueThisWeek.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {digest.dueThisWeek.length === 0 && <p className="text-sm text-muted-foreground">Nothing due this week.</p>}
            {digest.dueThisWeek.map((t) => (
              <div key={t.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm">
                <span>{t.name}</span>
                <span className="text-xs text-muted-foreground">{formatDate(t.due_date!, "EEE d MMM")}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {digest.overdueTasks.length > 0 && (
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base text-red-700 dark:text-red-400">
                <AlertTriangle className="h-4 w-4" /> Overdue tasks ({digest.overdueTasks.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {digest.overdueTasks.map((t) => (
                <div key={t.id} className="rounded-lg border border-red-200 bg-red-50/60 px-3 py-2 text-sm dark:border-red-900/40 dark:bg-red-950/20">
                  {t.name}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {(digest.overdueBookings.length > 0 || digest.upcomingTrials.length > 0) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="h-4 w-4 text-gold-600" /> Bookings to watch
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {digest.overdueBookings.map((b) => (
                <div key={b.id} className="rounded-lg border border-red-200 bg-red-50/60 px-3 py-2 text-sm dark:border-red-900/40 dark:bg-red-950/20">
                  {b.category} — not booked yet
                </div>
              ))}
              {digest.upcomingTrials.map((t, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm">
                  <span>{t.label}{t.vendor && ` (${t.vendor})`}</span>
                  <span className="text-xs text-muted-foreground">{formatDate(t.date, "EEE d MMM")}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

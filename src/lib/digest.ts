import { startOfWeek, endOfWeek, isWithinInterval, format } from "date-fns";
import { formatCurrency, formatDate, isOverdue } from "@/lib/utils";
import { getBookingUrgency } from "@/lib/bookings";
import type { Task, VendorBooking } from "@/lib/types";

export function getWeekRange(reference: Date = new Date()) {
  return {
    start: startOfWeek(reference, { weekStartsOn: 1 }), // Monday
    end: endOfWeek(reference, { weekStartsOn: 1 }), // Sunday
  };
}

export function buildDigest(tasks: Task[], bookings: VendorBooking[], weddingDate: string | null) {
  const { start, end } = getWeekRange();

  const completedThisWeek = tasks.filter(
    (t) => t.status === "completed" && isWithinInterval(new Date(t.updated_at), { start, end })
  );

  const dueThisWeek = tasks.filter(
    (t) =>
      t.status !== "completed" &&
      t.status !== "cancelled" &&
      t.due_date &&
      isWithinInterval(new Date(t.due_date), { start, end })
  );

  const overdueTasks = tasks.filter(
    (t) => t.status !== "completed" && t.status !== "cancelled" && isOverdue(t.due_date)
  );

  const overdueBookings = bookings.filter((b) => getBookingUrgency(b.category, weddingDate, b.status) === "overdue");

  const upcomingTrials: { label: string; date: string; vendor: string }[] = [];
  const next14 = new Date();
  next14.setDate(next14.getDate() + 14);
  for (const b of bookings) {
    if (b.trial_scheduled_date) {
      const d = new Date(b.trial_scheduled_date);
      if (d >= new Date(new Date().setHours(0, 0, 0, 0)) && d <= next14) {
        upcomingTrials.push({ label: `${b.category} trial`, date: b.trial_scheduled_date, vendor: b.vendor_name || "" });
      }
    }
    for (const fitting of b.fitting_dates ?? []) {
      const d = new Date(fitting);
      if (d >= new Date(new Date().setHours(0, 0, 0, 0)) && d <= next14) {
        upcomingTrials.push({ label: `${b.category} fitting`, date: fitting, vendor: b.vendor_name || "" });
      }
    }
  }
  upcomingTrials.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return { weekStart: start, weekEnd: end, completedThisWeek, dueThisWeek, overdueTasks, overdueBookings, upcomingTrials };
}

export function buildDigestText(digest: ReturnType<typeof buildDigest>, coupleNames: string) {
  const lines: string[] = [];
  lines.push(`*${coupleNames} — Weekly Update*`);
  lines.push(`${format(digest.weekStart, "d MMM")} – ${format(digest.weekEnd, "d MMM")}`);
  lines.push("");

  lines.push(`✅ *Completed this week (${digest.completedThisWeek.length})*`);
  if (digest.completedThisWeek.length === 0) lines.push("_Nothing marked complete yet_");
  digest.completedThisWeek.forEach((t) => lines.push(`• ${t.name}`));
  lines.push("");

  lines.push(`📅 *Due this week (${digest.dueThisWeek.length})*`);
  if (digest.dueThisWeek.length === 0) lines.push("_Nothing due_");
  digest.dueThisWeek.forEach((t) => lines.push(`• ${t.name} — ${formatDate(t.due_date!, "EEE d MMM")}`));
  lines.push("");

  if (digest.overdueTasks.length > 0) {
    lines.push(`⚠️ *Overdue tasks (${digest.overdueTasks.length})*`);
    digest.overdueTasks.forEach((t) => lines.push(`• ${t.name}`));
    lines.push("");
  }

  if (digest.overdueBookings.length > 0) {
    lines.push(`🚩 *Overdue bookings (${digest.overdueBookings.length})*`);
    digest.overdueBookings.forEach((b) => lines.push(`• ${b.category} — not booked yet`));
    lines.push("");
  }

  if (digest.upcomingTrials.length > 0) {
    lines.push(`✨ *Trials & fittings — next 2 weeks*`);
    digest.upcomingTrials.forEach((t) => lines.push(`• ${t.label}${t.vendor ? ` (${t.vendor})` : ""} — ${formatDate(t.date, "EEE d MMM")}`));
  }

  return lines.join("\n");
}

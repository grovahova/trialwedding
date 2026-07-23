import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { differenceInCalendarDays, differenceInSeconds, format, isPast, isToday } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: string | Date, pattern = "d MMM yyyy") {
  return format(new Date(date), pattern);
}

export function daysUntil(date: string | Date) {
  return differenceInCalendarDays(new Date(date), new Date());
}

export function secondsUntil(date: string | Date) {
  return Math.max(0, differenceInSeconds(new Date(date), new Date()));
}

export function isOverdue(date: string | Date | null) {
  if (!date) return false;
  return isPast(new Date(date)) && !isToday(new Date(date));
}

export function isDueToday(date: string | Date | null) {
  if (!date) return false;
  return isToday(new Date(date));
}

/** critical / urgent / upcoming / can_wait urgency engine, driven by due date + priority */
export function getUrgency(dueDate: string | null, priority: string, status: string) {
  if (status === "completed" || status === "cancelled") return "done";
  if (!dueDate) return "can_wait";
  const days = daysUntil(dueDate);
  if (days < 0) return "overdue";
  if (days === 0 || priority === "critical") return "critical";
  if (days <= 7) return "urgent";
  if (days <= 21) return "upcoming";
  return "can_wait";
}

export const URGENCY_STYLES: Record<string, { label: string; color: string; text: string }> = {
  overdue: { label: "Overdue", color: "bg-red-600", text: "text-red-700" },
  critical: { label: "Critical", color: "bg-red-500", text: "text-red-600" },
  urgent: { label: "Urgent", color: "bg-orange-500", text: "text-orange-600" },
  upcoming: { label: "Upcoming", color: "bg-amber-400", text: "text-amber-600" },
  can_wait: { label: "Can Wait", color: "bg-emerald-500", text: "text-emerald-600" },
  done: { label: "Done", color: "bg-gray-300", text: "text-gray-400" },
};

export function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function whatsappLink(phone: string, message: string) {
  const clean = phone.replace(/[^\d+]/g, "");
  return `https://wa.me/${clean.replace("+", "")}?text=${encodeURIComponent(message)}`;
}

/** No phone number — opens WhatsApp and lets the person pick who/which group to send to. */
export function whatsappShareLink(message: string) {
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

/**
 * Supabase (and fetch failures in general) don't always throw a plain Error
 * with a useful `.message` — sometimes it's an AuthApiError with an empty
 * body, sometimes a raw object, sometimes a TypeError from a failed fetch.
 * This pulls the most useful string out of whatever shape shows up, and
 * always logs the raw error so it's inspectable in the console.
 */
export function getErrorMessage(err: unknown): string {
  console.error("Error:", err);

  if (err instanceof Error && err.message && err.message !== "{}") return err.message;
  if (typeof err === "string" && err && err !== "{}") return err;

  if (err && typeof err === "object") {
    const anyErr = err as Record<string, unknown>;
    for (const key of ["message", "error_description", "msg", "hint", "details"]) {
      const val = anyErr[key];
      if (typeof val === "string" && val && val !== "{}") return val;
    }
  }

  return "Something went wrong. Open the browser console (F12 → Console) for the full error.";
}

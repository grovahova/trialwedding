import { differenceInCalendarDays } from "date-fns";
import type { BookingStatus } from "@/lib/types";

/** Typical lead time (in days before the wedding) by which this category should ideally be booked. */
export const BOOKING_CATEGORIES: { name: string; leadDays: number }[] = [
  { name: "Venue", leadDays: 270 },
  { name: "Food Catering", leadDays: 270 },
  { name: "Photographer", leadDays: 180 },
  { name: "Videographer", leadDays: 180 },
  { name: "Decoration", leadDays: 150 },
  { name: "Makeup Artist", leadDays: 120 },
  { name: "Wedding Clothes / Tailor", leadDays: 120 },
  { name: "Mehendi Artist", leadDays: 90 },
  { name: "DJ / Sound", leadDays: 120 },
  { name: "Lighting", leadDays: 120 },
  { name: "Transportation", leadDays: 60 },
  { name: "Flowers", leadDays: 60 },
  { name: "Jeweler", leadDays: 90 },
  { name: "Invitation Cards Printing", leadDays: 90 },
  { name: "Accommodation / Guest Hotel", leadDays: 90 },
  { name: "Others", leadDays: 60 },
];

export function getLeadDays(category: string) {
  return BOOKING_CATEGORIES.find((c) => c.name === category)?.leadDays ?? 60;
}

export const BOOKING_STATUS_STYLES: Record<BookingStatus, { label: string; badge: string }> = {
  not_booked: { label: "Not Booked", badge: "bg-gray-100 text-gray-600 border-gray-200" },
  enquired: { label: "Enquired", badge: "bg-blue-50 text-blue-700 border-blue-200" },
  negotiating: { label: "Negotiating", badge: "bg-purple-50 text-purple-700 border-purple-200" },
  booked: { label: "Booked", badge: "bg-amber-50 text-amber-700 border-amber-200" },
  confirmed: { label: "Confirmed", badge: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  cancelled: { label: "Cancelled", badge: "bg-red-50 text-red-500 border-red-200 line-through" },
};

export type BookingUrgency = "overdue" | "red" | "orange" | "yellow" | "green" | "done";

export const BOOKING_URGENCY_STYLES: Record<BookingUrgency, { label: string; dot: string; text: string; ring: string }> = {
  overdue: { label: "Overdue", dot: "bg-red-600", text: "text-red-700", ring: "ring-red-200" },
  red: { label: "Critical", dot: "bg-red-500", text: "text-red-600", ring: "ring-red-200" },
  orange: { label: "Urgent", dot: "bg-orange-500", text: "text-orange-600", ring: "ring-orange-200" },
  yellow: { label: "Plan Ahead", dot: "bg-amber-400", text: "text-amber-600", ring: "ring-amber-200" },
  green: { label: "On Track", dot: "bg-emerald-500", text: "text-emerald-600", ring: "ring-emerald-200" },
  done: { label: "Booked", dot: "bg-gray-300", text: "text-gray-400", ring: "ring-gray-200" },
};

/**
 * Urgency for an UNBOOKED vendor category, based on days remaining until the
 * "ideal book-by" date (wedding date minus this category's typical lead time).
 */
export function getBookingUrgency(
  category: string,
  weddingDate: string | null,
  status: BookingStatus
): BookingUrgency {
  if (status === "booked" || status === "confirmed" || status === "cancelled") return "done";
  if (!weddingDate) return "yellow";

  const leadDays = getLeadDays(category);
  const idealBookByDate = new Date(weddingDate);
  idealBookByDate.setDate(idealBookByDate.getDate() - leadDays);

  const daysRemaining = differenceInCalendarDays(idealBookByDate, new Date());

  if (daysRemaining < 0) return "overdue";
  if (daysRemaining <= 14) return "red";
  if (daysRemaining <= 30) return "orange";
  if (daysRemaining <= 60) return "yellow";
  return "green";
}

export function idealBookByDate(category: string, weddingDate: string) {
  const d = new Date(weddingDate);
  d.setDate(d.getDate() - getLeadDays(category));
  return d;
}

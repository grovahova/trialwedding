import { createClient } from "@/lib/supabase/server";
import { getTasks } from "@/lib/queries";
import { WeeklyDigestView } from "@/components/digest/weekly-digest-view";
import type { VendorBooking } from "@/lib/types";

export default async function DigestPage() {
  const supabase = createClient();

  const [tasks, { data: bookings }, { data: settings }] = await Promise.all([
    getTasks(supabase),
    supabase.from("vendor_bookings").select("*"),
    supabase.from("wedding_settings").select("*").eq("id", 1).single(),
  ]);

  return (
    <WeeklyDigestView
      tasks={tasks}
      bookings={(bookings as VendorBooking[]) ?? []}
      weddingDate={settings?.wedding_date ?? null}
      coupleNames={settings?.couple_names ?? "Our Wedding"}
    />
  );
}

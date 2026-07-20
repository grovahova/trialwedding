import { createClient } from "@/lib/supabase/server";
import { VendorsTable } from "@/components/vendors/vendors-table";
import type { Vendor, WeddingEvent } from "@/lib/types";

export default async function VendorsPage() {
  const supabase = createClient();
  const [{ data: vendors }, { data: events }] = await Promise.all([
    supabase.from("vendors").select("*").order("category"),
    supabase.from("events").select("*").eq("status", "active").order("position"),
  ]);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-display text-2xl font-semibold">Vendors</h1>
        <p className="text-sm text-muted-foreground">Bookings, payments, and ratings in one place.</p>
      </div>
      <VendorsTable vendors={(vendors as Vendor[]) ?? []} events={(events as WeddingEvent[]) ?? []} />
    </div>
  );
}

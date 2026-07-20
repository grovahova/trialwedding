import { createClient } from "@/lib/supabase/server";
import { GuestsTable } from "@/components/guests/guests-table";
import type { Guest } from "@/lib/types";

export default async function GuestsPage() {
  const supabase = createClient();
  const { data: guests } = await supabase.from("guests").select("*").order("name");

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-display text-2xl font-semibold">Guest List</h1>
        <p className="text-sm text-muted-foreground">RSVPs, invitations, and dietary preferences.</p>
      </div>
      <GuestsTable guests={(guests as Guest[]) ?? []} />
    </div>
  );
}

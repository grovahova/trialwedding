"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { initials } from "@/lib/utils";
import { toast } from "sonner";
import type { Profile, UserRole } from "@/lib/types";

export function MembersTable({ members, currentUserId }: { members: Profile[]; currentUserId: string }) {
  const supabase = createClient();
  const router = useRouter();

  async function changeRole(id: string, role: UserRole) {
    const { error } = await supabase.from("profiles").update({ role }).eq("id", id);
    if (error) return toast.error("Could not update role");
    toast.success("Role updated");
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Family Members &amp; Volunteers</CardTitle>
        <CardDescription>
          Admins have full access. Others can only edit tasks they're assigned to. New sign-ups appear here as
          volunteers by default — promote them if needed.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {members.map((m) => (
          <div key={m.id} className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2.5">
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback>{initials(m.full_name)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">
                  {m.full_name} {m.id === currentUserId && <span className="text-xs text-muted-foreground">(you)</span>}
                </p>
                {m.phone && <p className="text-xs text-muted-foreground">{m.phone}</p>}
              </div>
            </div>
            {m.id === currentUserId ? (
              <Badge variant="gold" className="capitalize">{m.role}</Badge>
            ) : (
              <Select value={m.role} onValueChange={(v) => changeRole(m.id, v as UserRole)}>
                <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="family">Family</SelectItem>
                  <SelectItem value="volunteer">Volunteer</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

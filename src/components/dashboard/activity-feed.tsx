import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { initials, formatDate } from "@/lib/utils";
import type { ActivityLogEntry } from "@/lib/types";
import { Activity } from "lucide-react";

export function ActivityFeed({ entries }: { entries: ActivityLogEntry[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Activity className="h-4 w-4 text-primary" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {entries.length === 0 && <p className="text-sm text-muted-foreground">No activity yet.</p>}
        {entries.map((entry) => (
          <div key={entry.id} className="flex items-start gap-3">
            <Avatar className="h-7 w-7">
              <AvatarFallback className="text-[10px]">
                {entry.profile?.full_name ? initials(entry.profile.full_name) : "?"}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-sm">
                <span className="font-medium">{entry.profile?.full_name ?? "Someone"}</span>{" "}
                <span className="text-muted-foreground">{entry.description}</span>
              </p>
              <p className="text-xs text-muted-foreground">{formatDate(entry.created_at, "d MMM, h:mm a")}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

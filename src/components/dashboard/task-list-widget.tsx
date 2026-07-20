import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Task } from "@/lib/types";
import { PRIORITY_STYLES } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import { CheckCircle2, LucideIcon } from "lucide-react";

export function TaskListWidget({
  title,
  icon: Icon,
  tasks,
  emptyLabel,
}: {
  title: string;
  icon: LucideIcon;
  tasks: Task[];
  emptyLabel: string;
}) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className="h-4 w-4 text-primary" />
          {title}
        </CardTitle>
        <Link href="/tasks" className="text-xs font-medium text-primary hover:underline">
          View all
        </Link>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {tasks.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-6 text-center text-sm text-muted-foreground">
            <CheckCircle2 className="h-6 w-6 text-emerald-400" />
            {emptyLabel}
          </div>
        )}
        {tasks.map((task) => (
          <div
            key={task.id}
            className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2.5 text-sm"
          >
            <div className="min-w-0">
              <p className="truncate font-medium">{task.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {task.event?.name ?? "Unassigned"} {task.due_date && `· Due ${formatDate(task.due_date)}`}
              </p>
            </div>
            <Badge className={PRIORITY_STYLES[task.priority].badge} variant="outline">
              {PRIORITY_STYLES[task.priority].label}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

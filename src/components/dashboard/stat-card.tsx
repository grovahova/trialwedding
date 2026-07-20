import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export function StatCard({
  icon: Icon,
  label,
  value,
  sublabel,
  progress,
  className,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  sublabel?: string;
  progress?: number;
  className?: string;
}) {
  return (
    <Card className={cn("gold-hover", className)}>
      <CardContent className="flex flex-col gap-3 p-5">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">{label}</span>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
            <Icon className="h-4 w-4" />
          </div>
        </div>
        <div className="font-display text-2xl font-semibold">{value}</div>
        {sublabel && <p className="text-xs text-muted-foreground">{sublabel}</p>}
        {progress !== undefined && <Progress value={progress} />}
      </CardContent>
    </Card>
  );
}

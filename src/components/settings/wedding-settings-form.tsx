"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { WeddingSettings } from "@/lib/types";

export function WeddingSettingsForm({ settings }: { settings: WeddingSettings }) {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    coupleNames: settings.couple_names,
    weddingDate: settings.wedding_date,
    planningStartDate: settings.planning_start_date,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase
      .from("wedding_settings")
      .update({
        couple_names: form.coupleNames,
        wedding_date: form.weddingDate,
        planning_start_date: form.planningStartDate,
      })
      .eq("id", 1);
    setLoading(false);
    if (error) return toast.error("Could not save settings");
    toast.success("Settings saved");
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Wedding Details</CardTitle>
        <CardDescription>This powers the countdown and planning-progress ring on the dashboard.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Couple names</Label>
            <Input value={form.coupleNames} onChange={(e) => setForm({ ...form, coupleNames: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Wedding date</Label>
              <Input type="date" value={form.weddingDate} onChange={(e) => setForm({ ...form, weddingDate: e.target.value })} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Planning start date</Label>
              <Input
                type="date"
                value={form.planningStartDate}
                onChange={(e) => setForm({ ...form, planningStartDate: e.target.value })}
              />
            </div>
          </div>
          <Button type="submit" variant="gold" className="w-fit" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save changes
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

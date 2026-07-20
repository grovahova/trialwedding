"use client";

import { useState } from "react";
import { Plus, ShoppingBag, Wallet, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreateTaskDialog } from "@/components/tasks/create-task-dialog";
import type { WeddingEvent, Profile } from "@/lib/types";

export function QuickActions({ events, members }: { events: WeddingEvent[]; members: Profile[] }) {
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-2">
        <Button variant="outline" className="h-auto flex-col gap-1.5 py-4" onClick={() => setTaskDialogOpen(true)}>
          <Plus className="h-4 w-4" /> Add Task
        </Button>
        <Button variant="outline" className="h-auto flex-col gap-1.5 py-4" asChild>
          <a href="/shopping">
            <ShoppingBag className="h-4 w-4" /> Add Item
          </a>
        </Button>
        <Button variant="outline" className="h-auto flex-col gap-1.5 py-4" asChild>
          <a href="/budget">
            <Wallet className="h-4 w-4" /> Log Expense
          </a>
        </Button>
        <Button variant="outline" className="h-auto flex-col gap-1.5 py-4" asChild>
          <a href="/guests">
            <Users className="h-4 w-4" /> Add Guest
          </a>
        </Button>
      </CardContent>
      <CreateTaskDialog
        open={taskDialogOpen}
        onOpenChange={setTaskDialogOpen}
        events={events}
        members={members}
      />
    </Card>
  );
}

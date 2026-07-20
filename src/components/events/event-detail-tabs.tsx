"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { TaskBoardShell } from "@/components/tasks/task-board-shell";
import { ShoppingTable } from "@/components/shopping/shopping-table";
import { BudgetTable } from "@/components/budget/budget-table";
import type { Task, Profile, WeddingEvent, ShoppingItem, BudgetItem, Vendor } from "@/lib/types";

export function EventDetailTabs({
  event,
  tasks,
  shopping,
  budget,
  vendors,
  events,
  members,
  currentProfile,
}: {
  event: WeddingEvent;
  tasks: Task[];
  shopping: ShoppingItem[];
  budget: BudgetItem[];
  vendors: Vendor[];
  events: WeddingEvent[];
  members: Profile[];
  currentProfile: Profile;
}) {
  return (
    <Tabs defaultValue="tasks">
      <TabsList>
        <TabsTrigger value="tasks">Tasks</TabsTrigger>
        <TabsTrigger value="shopping">Shopping</TabsTrigger>
        <TabsTrigger value="budget">Budget</TabsTrigger>
      </TabsList>

      <TabsContent value="tasks">
        <TaskBoardShell
          initialTasks={tasks}
          events={events}
          members={members}
          currentProfile={currentProfile}
          defaultEventId={event.id}
          hideEventFilter
        />
      </TabsContent>

      <TabsContent value="shopping">
        <ShoppingTable items={shopping} events={events} members={members} defaultEventId={event.id} />
      </TabsContent>

      <TabsContent value="budget">
        <BudgetTable items={budget} events={events} vendors={vendors} defaultEventId={event.id} />
      </TabsContent>
    </Tabs>
  );
}

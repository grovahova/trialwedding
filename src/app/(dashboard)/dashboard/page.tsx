import { AlertTriangle, CalendarClock, CheckCircle2, ShoppingBag, Wallet, ClipboardCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getTasks } from "@/lib/queries";
import { CountdownHero } from "@/components/dashboard/countdown-hero";
import { StatCard } from "@/components/dashboard/stat-card";
import { TaskListWidget } from "@/components/dashboard/task-list-widget";
import { EventStatusWidget } from "@/components/dashboard/event-status-widget";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { OverdueBookingsWidget } from "@/components/dashboard/overdue-bookings-widget";
import { formatCurrency, isDueToday, isOverdue } from "@/lib/utils";
import type { Profile, WeddingEvent, VendorBooking } from "@/lib/types";

export default async function DashboardPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: settings }, { data: events }, { data: profiles }, tasks, { data: activity }, { data: shopping }, { data: budget }, { data: bookings }] =
    await Promise.all([
      supabase.from("wedding_settings").select("*").eq("id", 1).single(),
      supabase.from("events").select("*").eq("status", "active").order("position"),
      supabase.from("profiles").select("*"),
      getTasks(supabase),
      supabase
        .from("activity_log")
        .select("*, profile:profiles(full_name, avatar_url)")
        .order("created_at", { ascending: false })
        .limit(8),
      supabase.from("shopping_items").select("*"),
      supabase.from("budget_items").select("*"),
      supabase.from("vendor_bookings").select("*"),
    ]);

  const profile = (profiles as Profile[] | null)?.find((p) => p.id === user?.id) ?? null;
  const eventList = (events as WeddingEvent[]) ?? [];

  const openTasks = tasks.filter((t) => t.status !== "completed" && t.status !== "cancelled");
  const completedTasks = tasks.filter((t) => t.status === "completed");
  const overallCompletion = tasks.length === 0 ? 0 : Math.round((completedTasks.length / tasks.length) * 100);

  const urgentTasks = openTasks
    .filter((t) => t.priority === "critical" || isOverdue(t.due_date))
    .slice(0, 5);
  const todayTasks = openTasks.filter((t) => isDueToday(t.due_date)).slice(0, 5);

  const eventsWithProgress = eventList.map((e) => {
    const eventTasks = tasks.filter((t) => t.event_id === e.id);
    return {
      ...e,
      taskCount: eventTasks.length,
      completedCount: eventTasks.filter((t) => t.status === "completed").length,
    };
  });

  const shoppingItems = shopping ?? [];
  const purchasedCount = shoppingItems.filter((s) => s.status === "purchased").length;

  const budgetItems = budget ?? [];
  const totalPlanned = budgetItems.reduce((sum, b) => sum + Number(b.planned_amount), 0);
  const totalActual = budgetItems.reduce((sum, b) => sum + Number(b.actual_amount), 0);

  const bookingList = (bookings as VendorBooking[]) ?? [];
  const confirmedBookings = bookingList.filter((b) => b.status === "confirmed" || b.status === "booked").length;

  return (
    <div className="flex flex-col gap-6">
      {settings && (
        <CountdownHero
          weddingDate={settings.wedding_date}
          planningStartDate={settings.planning_start_date}
          coupleNames={settings.couple_names}
        />
      )}

      <div>
        <h2 className="mb-1 font-display text-xl font-semibold">
          Welcome back{profile ? `, ${profile.full_name.split(" ")[0]}` : ""} 👋
        </h2>
        <p className="text-sm text-muted-foreground">Here's where the planning stands today.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          icon={CheckCircle2}
          label="Overall Progress"
          value={`${overallCompletion}%`}
          sublabel={`${completedTasks.length} of ${tasks.length} tasks complete`}
          progress={overallCompletion}
        />
        <StatCard
          icon={AlertTriangle}
          label="Urgent Tasks"
          value={String(urgentTasks.length)}
          sublabel="Critical or overdue"
        />
        <StatCard
          icon={ClipboardCheck}
          label="Vendor Bookings"
          value={`${confirmedBookings}/${bookingList.length}`}
          sublabel="Confirmed"
          progress={bookingList.length === 0 ? 0 : Math.round((confirmedBookings / bookingList.length) * 100)}
        />
        <StatCard
          icon={ShoppingBag}
          label="Shopping"
          value={`${purchasedCount}/${shoppingItems.length}`}
          sublabel="Items purchased"
        />
        <StatCard
          icon={Wallet}
          label="Budget Used"
          value={formatCurrency(totalActual)}
          sublabel={`of ${formatCurrency(totalPlanned)} planned`}
          progress={totalPlanned === 0 ? 0 : Math.min(100, Math.round((totalActual / totalPlanned) * 100))}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TaskListWidget
              title="Urgent Tasks"
              icon={AlertTriangle}
              tasks={urgentTasks}
              emptyLabel="Nothing urgent — great job!"
            />
            <TaskListWidget
              title="Today's Tasks"
              icon={CalendarClock}
              tasks={todayTasks}
              emptyLabel="No tasks due today."
            />
          </div>
          <EventStatusWidget events={eventsWithProgress} />
        </div>

        <div className="flex flex-col gap-4">
          {profile && <QuickActions events={eventList} members={(profiles as Profile[]) ?? []} />}
          <OverdueBookingsWidget bookings={(bookings as VendorBooking[]) ?? []} weddingDate={settings?.wedding_date ?? null} />
          <ActivityFeed entries={(activity as any) ?? []} />
        </div>
      </div>
    </div>
  );
}

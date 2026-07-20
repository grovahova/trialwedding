"use client";

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { formatCurrency } from "@/lib/utils";
import type { BudgetItem } from "@/lib/types";

// Festive palette pulled from the app's emerald/gold theme, rotated across categories.
const COLORS = ["#187d5c", "#dba93a", "#79d2ab", "#c8912a", "#0f3a2f", "#f5ebc9", "#48b78c", "#8a591e"];

export function BudgetSpendPieChart({ items }: { items: BudgetItem[] }) {
  const byCategory = Object.values(
    items.reduce<Record<string, { name: string; value: number }>>((acc, item) => {
      const spend = Number(item.actual_amount);
      if (spend <= 0) return acc;
      acc[item.category] ??= { name: item.category, value: 0 };
      acc[item.category].value += spend;
      return acc;
    }, {})
  ).sort((a, b) => b.value - a.value);

  const total = byCategory.reduce((sum, c) => sum + c.value, 0);

  if (byCategory.length === 0) {
    return (
      <div className="flex h-72 flex-col items-center justify-center rounded-xl border border-border bg-card p-4 text-center shadow-soft">
        <p className="text-sm font-medium">No spend recorded yet</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Once budget lines have an actual amount, their split shows up here.
        </p>
      </div>
    );
  }

  return (
    <div className="h-72 w-full rounded-xl border border-border bg-card p-4 shadow-soft">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={byCategory}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={90}
            paddingAngle={2}
          >
            {byCategory.map((entry, index) => (
              <Cell key={entry.name} fill={COLORS[index % COLORS.length]} stroke="hsl(var(--card))" strokeWidth={2} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number, name: string) => [
              `${formatCurrency(value)} (${((value / total) * 100).toFixed(0)}%)`,
              name,
            ]}
          />
          <Legend
            layout="vertical"
            align="right"
            verticalAlign="middle"
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 12 }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

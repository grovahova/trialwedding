"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { formatCurrency } from "@/lib/utils";
import type { BudgetItem } from "@/lib/types";

export function BudgetChart({ items }: { items: BudgetItem[] }) {
  const byCategory = Object.values(
    items.reduce<Record<string, { category: string; planned: number; actual: number }>>((acc, item) => {
      acc[item.category] ??= { category: item.category, planned: 0, actual: 0 };
      acc[item.category].planned += Number(item.planned_amount);
      acc[item.category].actual += Number(item.actual_amount);
      return acc;
    }, {})
  );

  if (byCategory.length === 0) return null;

  return (
    <div className="h-72 w-full rounded-xl border border-border bg-card p-4 shadow-soft">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={byCategory} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="category" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `₹${v / 1000}k`} />
          <Tooltip formatter={(value: number) => formatCurrency(value)} />
          <Bar dataKey="planned" fill="#79d2ab" radius={[4, 4, 0, 0]} name="Planned" />
          <Bar dataKey="actual" fill="#dba93a" radius={[4, 4, 0, 0]} name="Actual" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatMetricValue } from "@/lib/formatting";
import type { MetricUnit } from "@/types";

interface MonthPoint {
  month: string;
  value: number;
  priorYearValue: number | null;
}

function monthLabel(month: string): string {
  return new Date(month + "-01T00:00:00Z").toLocaleDateString("en-LK", { month: "short", year: "2-digit", timeZone: "UTC" });
}

export default function MetricChart({ months, unit }: { months: MonthPoint[]; unit: MetricUnit }) {
  const chartData = months.map((m) => ({ ...m, label: monthLabel(m.month) }));

  return (
    <div className="card p-3" style={{ height: 280 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 8, right: 12, left: 4, bottom: 0 }}>
          <CartesianGrid stroke="var(--border-soft)" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 10.5, fill: "var(--text-faint)" }} axisLine={{ stroke: "var(--border)" }} tickLine={false} />
          <YAxis
            tick={{ fontSize: 9.5, fill: "var(--text-faint)" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => formatMetricValue(v, unit)}
          />
          <Tooltip
            formatter={(value) => formatMetricValue(Number(value), unit)}
            contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", fontSize: 12 }}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar dataKey="value" name="This year" fill="var(--teal)" radius={[3, 3, 0, 0]} />
          <Bar dataKey="priorYearValue" name="Prior year" fill="var(--border)" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

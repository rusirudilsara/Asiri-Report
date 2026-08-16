"use client";

import { useState } from "react";
import type { DailyPerformanceMetric } from "@/types";
import MetricRow from "./MetricRow";

export default function AccordionSection({
  category,
  metrics,
  defaultOpen = false,
}: {
  category: string;
  metrics: DailyPerformanceMetric[];
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="card mb-2 overflow-hidden">
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer select-none"
        onClick={() => setOpen((o) => !o)}
      >
        <div>
          <div className="text-[14px] font-semibold">{category}</div>
          <div className="text-[10.5px]" style={{ color: "var(--text-faint)" }}>
            {metrics.length} tracked KPI{metrics.length !== 1 ? "s" : ""}
          </div>
        </div>
        <span
          className="text-[11px] transition-transform"
          style={{ color: "var(--text-dim)", transform: open ? "rotate(180deg)" : "none" }}
        >
          ▾
        </span>
      </div>
      {open && (
        <div className="px-4 pb-3 pt-1" style={{ borderTop: "1px solid var(--border-soft)" }}>
          {metrics.map((m) => (
            <MetricRow key={m.metricCode} metric={m} />
          ))}
        </div>
      )}
    </div>
  );
}

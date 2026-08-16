import { formatMetricValue } from "@/lib/formatting";
import type { MetricUnit } from "@/types";

export default function ComparisonBars({
  rows,
  unit,
  currentHospital,
}: {
  rows: { hospitalCode: string; hospitalName: string; value: number }[];
  unit: MetricUnit;
  currentHospital: string;
}) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <div className="card p-4 flex flex-col gap-2.5">
      {rows.map((r) => {
        const isCurrent = r.hospitalCode === currentHospital;
        return (
          <div key={r.hospitalCode} className="grid grid-cols-[110px_1fr_90px] items-center gap-2.5">
            <div
              className="text-[11px] truncate"
              style={{ color: isCurrent ? "var(--teal-light)" : "var(--text-dim)", fontWeight: isCurrent ? 700 : 400 }}
            >
              {r.hospitalCode}
            </div>
            <div className="h-3.5 rounded-md overflow-hidden" style={{ background: "var(--surface2)" }}>
              <div
                className="h-full rounded-md"
                style={{ width: `${(r.value / max) * 100}%`, background: isCurrent ? "var(--teal-light)" : "var(--teal)" }}
              />
            </div>
            <div className="text-[11px] text-right font-semibold">{formatMetricValue(r.value, unit)}</div>
          </div>
        );
      })}
    </div>
  );
}

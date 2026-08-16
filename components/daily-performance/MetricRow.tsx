import type { DailyPerformanceMetric } from "@/types";
import { formatMetricValue } from "@/lib/formatting";
import { deltaDirection } from "@/lib/calculations";

const DELTA_COLOR: Record<string, string> = {
  up: "var(--good)",
  down: "var(--bad)",
  flat: "var(--text-faint)",
};
const DELTA_ARROW: Record<string, string> = { up: "▲", down: "▼", flat: "—" };

function CompareLine({ label, value, actual, unit, lowerIsBetter }: { label: string; value: number | null; actual: number; unit: DailyPerformanceMetric["unit"]; lowerIsBetter: boolean }) {
  if (value === null) return null;
  const dir = deltaDirection(actual, value, lowerIsBetter);
  const pct = value ? Math.abs(Math.round(((actual - value) / value) * 100)) : 0;
  return (
    <div className="text-[10.5px] mt-1" style={{ color: "var(--text-faint)" }}>
      {label} {formatMetricValue(value, unit)}{" "}
      <span className="font-semibold" style={{ color: DELTA_COLOR[dir] }}>
        {DELTA_ARROW[dir]} {pct}%
      </span>
    </div>
  );
}

export default function MetricRow({ metric }: { metric: DailyPerformanceMetric }) {
  const mtd = metric.mtdValue ?? metric.actualValue;
  return (
    <div className="py-2.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
      <div className="text-[12.5px] mb-1.5" style={{ color: "var(--text-dim)" }}>
        {metric.metricName}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg px-2.5 py-1.5" style={{ background: "var(--surface2)", border: "1px solid var(--border-soft)" }}>
          <div className="text-[9px] uppercase tracking-wide" style={{ color: "var(--text-faint)" }}>
            Day (last)
          </div>
          <div className="text-[14px] font-bold mt-0.5">{formatMetricValue(metric.actualValue, metric.unit)}</div>
        </div>
        <div
          className="rounded-lg px-2.5 py-1.5"
          style={{ background: "rgba(30,140,130,0.08)", border: "1px solid rgba(79,189,174,0.25)" }}
        >
          <div className="text-[9px] uppercase tracking-wide" style={{ color: "var(--text-faint)" }}>
            MTD
          </div>
          <div className="text-[14px] font-bold mt-0.5">{formatMetricValue(mtd, metric.unit)}</div>
          <CompareLine label="Budget" value={metric.budgetValue} actual={mtd} unit={metric.unit} lowerIsBetter={metric.lowerIsBetter} />
          <CompareLine label="Cum LM" value={metric.priorMonthValue} actual={mtd} unit={metric.unit} lowerIsBetter={metric.lowerIsBetter} />
          <CompareLine label="Prior Year" value={metric.priorYearValue} actual={mtd} unit={metric.unit} lowerIsBetter={metric.lowerIsBetter} />
          {metric.targetValue !== null && (
            <div className="text-[10.5px] mt-1" style={{ color: "var(--text-faint)" }}>
              Target {formatMetricValue(metric.targetValue, metric.unit)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

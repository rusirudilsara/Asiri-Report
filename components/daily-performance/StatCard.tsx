import type { DailyPerformanceMetric } from "@/types";
import { formatMetricValue } from "@/lib/formatting";
import { ragStatus } from "@/lib/calculations";

const RAG_COLOR: Record<string, string> = {
  good: "var(--good)",
  warn: "var(--warn)",
  bad: "var(--bad)",
};

export default function StatCard({ metric }: { metric: DailyPerformanceMetric }) {
  const reference = metric.targetValue ?? metric.budgetValue;
  const rag = ragStatus(metric.mtdValue ?? metric.actualValue, reference, metric.lowerIsBetter);

  return (
    <div className="card p-3.5">
      <div className="stat-label">{metric.metricName}</div>
      <div className="stat-value flex items-center gap-2">
        <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: RAG_COLOR[rag] }} />
        {formatMetricValue(metric.mtdValue ?? metric.actualValue, metric.unit)}
      </div>
      <div className="text-[11.5px] mt-1" style={{ color: "var(--teal-light)" }}>
        Day (last): <b style={{ color: "var(--text)" }}>{formatMetricValue(metric.actualValue, metric.unit)}</b>
      </div>
      {metric.budgetValue !== null && (
        <div className="stat-sub">vs Budget {formatMetricValue(metric.budgetValue, metric.unit)}</div>
      )}
      {metric.targetValue !== null && (
        <div className="stat-sub">Target {formatMetricValue(metric.targetValue, metric.unit)}</div>
      )}
    </div>
  );
}

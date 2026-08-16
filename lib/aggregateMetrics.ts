import type { DailyPerformanceMetric, MetricUnit } from "@/types";

const ADDITIVE_UNITS: MetricUnit[] = ["count", "LKR"];

function sumOrNull(values: (number | null)[]): number | null {
  const present = values.filter((v): v is number => v !== null);
  if (present.length === 0) return null;
  return present.reduce((a, b) => a + b, 0);
}

function avgOrNull(values: (number | null)[]): number | null {
  const present = values.filter((v): v is number => v !== null);
  if (present.length === 0) return null;
  return present.reduce((a, b) => a + b, 0) / present.length;
}

/**
 * Rolls per-hospital DailyPerformance rows for one report date up to a single
 * "All Hospitals" row per metric. Count/LKR (additive) metrics are summed;
 * rate-style metrics (%, days, min, hrs, kg, ratio) are averaged across the
 * hospitals reporting that metric that day. This mirrors the aggregation
 * approach used by the original report prototypes' client-side JS.
 */
export function aggregateToAllHospitals(rows: DailyPerformanceMetric[]): DailyPerformanceMetric[] {
  const byMetric = new Map<string, DailyPerformanceMetric[]>();
  for (const row of rows) {
    const list = byMetric.get(row.metricCode) ?? [];
    list.push(row);
    byMetric.set(row.metricCode, list);
  }

  const result: DailyPerformanceMetric[] = [];
  for (const [, group] of byMetric) {
    const first = group[0];
    const additive = ADDITIVE_UNITS.includes(first.unit);
    const combine = additive ? sumOrNull : avgOrNull;
    result.push({
      ...first,
      hospitalId: 0,
      hospitalCode: "ALL",
      hospitalName: "All Hospitals",
      actualValue: combine(group.map((g) => g.actualValue)) ?? 0,
      mtdValue: combine(group.map((g) => g.mtdValue)),
      targetValue: combine(group.map((g) => g.targetValue)),
      budgetValue: combine(group.map((g) => g.budgetValue)),
      priorMonthValue: combine(group.map((g) => g.priorMonthValue)),
      priorYearValue: combine(group.map((g) => g.priorYearValue)),
    });
  }
  return result.sort((a, b) => a.sortOrder - b.sortOrder || a.category.localeCompare(b.category));
}

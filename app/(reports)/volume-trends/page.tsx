"use client";

import { useMemo, useState } from "react";
import { useApi } from "@/hooks/useApi";
import HospitalSelector from "@/components/HospitalSelector";
import MetricChart from "@/components/volume-trends/MetricChart";
import ComparisonBars from "@/components/volume-trends/ComparisonBars";
import { LoadingState, ErrorState, NoDataState } from "@/components/StatusStates";
import { formatMetricValue } from "@/lib/formatting";
import { variancePct } from "@/lib/calculations";
import type { Hospital, MetricUnit } from "@/types";

interface MetricOption {
  category: string;
  metricCode: string;
  metricName: string;
  unit: MetricUnit;
}

function currentYearMonth(offsetMonths = 0): string {
  const d = new Date();
  d.setMonth(d.getMonth() + offsetMonths);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function VolumeTrendsPage() {
  const [hospital, setHospital] = useState("ALL");
  const [metricCode, setMetricCode] = useState("");
  const [from, setFrom] = useState(currentYearMonth(-5));
  const [to, setTo] = useState(currentYearMonth(0));

  const { data: hospitalsData } = useApi<{ hospitals: Hospital[] }>("/api/hospitals");
  const hospitals = hospitalsData?.hospitals ?? [];

  const { data: metricsData } = useApi<{ metrics: MetricOption[] }>("/api/volume-trends/metrics");
  const metrics = useMemo(() => metricsData?.metrics ?? [], [metricsData]);
  const byCategory = useMemo(() => {
    const map = new Map<string, MetricOption[]>();
    for (const m of metrics) {
      const list = map.get(m.category) ?? [];
      list.push(m);
      map.set(m.category, list);
    }
    return map;
  }, [metrics]);

  // Fall back to the first available metric until the user picks one explicitly —
  // avoids needing an effect just to seed `metricCode` once options arrive.
  const effectiveMetricCode = metricCode || metrics[0]?.metricCode || "";

  const trendsUrl = effectiveMetricCode
    ? `/api/volume-trends?hospital=${encodeURIComponent(hospital)}&metricCode=${encodeURIComponent(effectiveMetricCode)}&from=${from}&to=${to}`
    : null;
  const { data, loading, error, refetch } = useApi<{
    metricName: string;
    unit: MetricUnit;
    months: { month: string; value: number; priorYearValue: number | null }[];
    ytd: number;
    priorYearYtd: number | null;
    monthlyAverage: number;
  }>(trendsUrl);

  const compareUrl = effectiveMetricCode
    ? `/api/volume-trends/compare?metricCode=${encodeURIComponent(effectiveMetricCode)}&from=${from}&to=${to}`
    : null;
  const { data: compareData } = useApi<{ hospitals: { hospitalCode: string; hospitalName: string; value: number }[] }>(compareUrl);

  const yoyPct = data?.priorYearYtd ? variancePct(data.ytd, data.priorYearYtd) : null;

  return (
    <div>
      <div className="mb-5">
        <h1 className="font-display text-xl">Volume Trends</h1>
        <p className="text-[13px] mt-1" style={{ color: "var(--text-dim)" }}>
          Monthly trend, year-to-date total, and prior-year variance for any tracked metric.
        </p>
      </div>

      <div className="card p-3.5 mb-5 flex items-end gap-4 flex-wrap">
        <div>
          <div className="text-[10.5px] uppercase tracking-wide mb-1.5" style={{ color: "var(--text-faint)" }}>
            Hospital
          </div>
          <HospitalSelector hospitals={hospitals} value={hospital} onChange={setHospital} />
        </div>
        <Field label="Metric">
          <select value={effectiveMetricCode} onChange={(e) => setMetricCode(e.target.value)} className="input-field min-w-[260px]">
            {[...byCategory.entries()].map(([category, opts]) => (
              <optgroup key={category} label={category}>
                {opts.map((m) => (
                  <option key={m.metricCode} value={m.metricCode}>
                    {m.metricName}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </Field>
        <Field label="From month">
          <input type="month" value={from} max={to} onChange={(e) => setFrom(e.target.value)} className="input-field" />
        </Field>
        <Field label="To month">
          <input type="month" value={to} min={from} max={currentYearMonth(0)} onChange={(e) => setTo(e.target.value)} className="input-field" />
        </Field>
      </div>

      {loading && <LoadingState />}
      {error && <ErrorState message={error} onRetry={refetch} />}
      {!loading && !error && (data?.months.length ?? 0) === 0 && (
        <NoDataState message="No data has been loaded for this metric and date range yet." />
      )}

      {!loading && !error && data && data.months.length > 0 && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-5">
            <StatTile label={`${data.metricName} — YTD`} value={formatMetricValue(data.ytd, data.unit)} accent="teal" />
            <StatTile label="Monthly Average" value={formatMetricValue(data.monthlyAverage, data.unit)} />
            <StatTile
              label="Prior Year YTD"
              value={data.priorYearYtd !== null ? formatMetricValue(data.priorYearYtd, data.unit) : "—"}
            />
            <StatTile
              label="YoY Variance"
              value={yoyPct !== null ? `${yoyPct >= 0 ? "+" : ""}${yoyPct.toFixed(1)}%` : "—"}
              accent={yoyPct === null ? undefined : yoyPct >= 0 ? "good" : "bad"}
            />
          </div>

          <MetricChart months={data.months} unit={data.unit} />

          <div className="card p-1 overflow-x-auto mt-4 mb-6">
            <table className="table-shell">
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Value</th>
                  <th>Prior Year</th>
                  <th>Variance %</th>
                </tr>
              </thead>
              <tbody>
                {data.months.map((m) => {
                  const v = m.priorYearValue !== null ? variancePct(m.value, m.priorYearValue) : null;
                  return (
                    <tr key={m.month}>
                      <td>{new Date(m.month + "-01T00:00:00Z").toLocaleDateString("en-LK", { month: "short", year: "numeric", timeZone: "UTC" })}</td>
                      <td className="num">{formatMetricValue(m.value, data.unit)}</td>
                      <td className="num">{m.priorYearValue !== null ? formatMetricValue(m.priorYearValue, data.unit) : "—"}</td>
                      <td className="num" style={{ color: v === null ? "var(--text-faint)" : v >= 0 ? "var(--good)" : "var(--bad)" }}>
                        {v !== null ? `${v >= 0 ? "+" : ""}${v.toFixed(1)}%` : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {hospital === "ALL" && compareData && compareData.hospitals.length > 0 && (
            <>
              <h2 className="font-display text-[15.5px] mb-2.5">Hospital Comparison</h2>
              <ComparisonBars rows={compareData.hospitals} unit={data.unit} currentHospital={hospital} />
            </>
          )}
        </>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10.5px] uppercase tracking-wide mb-1.5" style={{ color: "var(--text-faint)" }}>
        {label}
      </div>
      {children}
    </div>
  );
}

function StatTile({ label, value, accent }: { label: string; value: string; accent?: "teal" | "good" | "bad" }) {
  const color = accent === "teal" ? "var(--teal-light)" : accent === "good" ? "var(--good)" : accent === "bad" ? "var(--bad)" : "var(--text)";
  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className="stat-value text-[19px]" style={{ color }}>
        {value}
      </div>
    </div>
  );
}

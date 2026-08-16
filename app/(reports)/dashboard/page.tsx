"use client";

import { useMemo, useState } from "react";
import { useApi } from "@/hooks/useApi";
import DateHospitalControls from "@/components/DateHospitalControls";
import StatCard from "@/components/daily-performance/StatCard";
import AccordionSection from "@/components/daily-performance/AccordionSection";
import { LoadingState, ErrorState, NoDataState, LastUpdated } from "@/components/StatusStates";
import { todayISO } from "@/lib/formatting";
import type { DailyPerformanceMetric, Hospital } from "@/types";

const FEATURED_CATEGORIES = ["Snapshot", "Executive Summary"];

export default function DashboardPage() {
  const [hospital, setHospital] = useState("ALL");
  const [date, setDate] = useState(todayISO());

  const { data: hospitalsData } = useApi<{ hospitals: Hospital[] }>("/api/hospitals");
  const hospitals = hospitalsData?.hospitals ?? [];

  const url = `/api/daily-performance?hospital=${encodeURIComponent(hospital)}&date=${date}`;
  const { data, loading, error, refetch } = useApi<{
    metrics: DailyPerformanceMetric[];
    lastUpdated: string | null;
  }>(url);

  const grouped = useMemo(() => {
    const map = new Map<string, DailyPerformanceMetric[]>();
    for (const m of data?.metrics ?? []) {
      const list = map.get(m.category) ?? [];
      list.push(m);
      map.set(m.category, list);
    }
    return map;
  }, [data]);

  const featured = FEATURED_CATEGORIES.filter((c) => grouped.has(c));
  const other = [...grouped.keys()].filter((c) => !FEATURED_CATEGORIES.includes(c));

  return (
    <div>
      <div className="mb-5">
        <h1 className="font-display text-xl">Daily Performance Report</h1>
        <p className="text-[13px] mt-1" style={{ color: "var(--text-dim)" }}>
          &ldquo;Day&rdquo; is the selected report date&apos;s figure. &ldquo;MTD&rdquo; is the running month-to-date
          total or average.
        </p>
      </div>

      <DateHospitalControls
        hospitals={hospitals}
        hospital={hospital}
        onHospitalChange={setHospital}
        date={date}
        onDateChange={setDate}
        maxDate={todayISO()}
      />

      {loading && <LoadingState />}
      {error && <ErrorState message={error} onRetry={refetch} />}
      {!loading && !error && (data?.metrics.length ?? 0) === 0 && (
        <NoDataState message="No Daily Performance metrics have been loaded for this hospital and date yet." />
      )}

      {!loading && !error && (data?.metrics.length ?? 0) > 0 && (
        <>
          <div className="mb-3">
            <LastUpdated iso={data?.lastUpdated ?? null} />
          </div>

          {featured.map((category) => (
            <section key={category} className="mb-6">
              <SectionHeading title={category} />
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
                {grouped.get(category)!.map((m) => (
                  <StatCard key={m.metricCode} metric={m} />
                ))}
              </div>
            </section>
          ))}

          {other.length > 0 && (
            <section>
              <SectionHeading title="Operational & Clinical Sections" />
              {other.map((category) => (
                <AccordionSection key={category} category={category} metrics={grouped.get(category)!} />
              ))}
            </section>
          )}
        </>
      )}
    </div>
  );
}

function SectionHeading({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-2 mb-2.5">
      <h2 className="font-display text-[15.5px]">{title}</h2>
      <div className="flex-1 h-px" style={{ background: "var(--border-soft)" }} />
    </div>
  );
}

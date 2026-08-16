"use client";

import { useMemo, useState } from "react";
import { useApi } from "@/hooks/useApi";
import HospitalSelector from "@/components/HospitalSelector";
import DoctorTable from "@/components/doctor-performance/DoctorTable";
import { LoadingState, ErrorState, NoDataState } from "@/components/StatusStates";
import { todayISO } from "@/lib/formatting";
import type { DoctorAggregate, Hospital } from "@/types";

function firstOfMonth(): string {
  const d = new Date();
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), 1)).toISOString().slice(0, 10);
}

export default function DoctorPerformancePage() {
  const [hospital, setHospital] = useState("ALL");
  const [from, setFrom] = useState(firstOfMonth());
  const [to, setTo] = useState(todayISO());
  const [specialty, setSpecialty] = useState("ALL");
  const [search, setSearch] = useState("");

  const { data: hospitalsData } = useApi<{ hospitals: Hospital[] }>("/api/hospitals");
  const hospitals = hospitalsData?.hospitals ?? [];

  const url = `/api/doctor-performance?hospital=${encodeURIComponent(hospital)}&from=${from}&to=${to}&specialty=${encodeURIComponent(
    specialty
  )}&search=${encodeURIComponent(search)}`;
  const { data, loading, error, refetch } = useApi<{ doctors: DoctorAggregate[] }>(url);

  const doctors = useMemo(() => data?.doctors ?? [], [data]);
  const specialties = useMemo(() => [...new Set(doctors.map((d) => d.specialty))].sort(), [doctors]);

  function resetFilters() {
    setHospital("ALL");
    setFrom(firstOfMonth());
    setTo(todayISO());
    setSpecialty("ALL");
    setSearch("");
  }

  return (
    <div>
      <div className="mb-5">
        <h1 className="font-display text-xl">Doctor Performance Dashboard</h1>
        <p className="text-[13px] mt-1" style={{ color: "var(--text-dim)" }}>
          Hospital income contribution by consultant, split across inpatient and channeling.
        </p>
      </div>

      <div className="card p-3.5 mb-5 flex items-end gap-4 flex-wrap">
        <div>
          <div className="text-[10.5px] uppercase tracking-wide mb-1.5" style={{ color: "var(--text-faint)" }}>
            Hospital
          </div>
          <HospitalSelector hospitals={hospitals} value={hospital} onChange={setHospital} />
        </div>
        <Field label="From">
          <input type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} className="input-field" />
        </Field>
        <Field label="To">
          <input type="date" value={to} min={from} max={todayISO()} onChange={(e) => setTo(e.target.value)} className="input-field" />
        </Field>
        <Field label="Specialty">
          <select value={specialty} onChange={(e) => setSpecialty(e.target.value)} className="input-field">
            <option value="ALL">All specialties</option>
            {specialties.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Search doctor">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="e.g. Perera, Cardiologist…"
            className="input-field"
          />
        </Field>
        <button onClick={resetFilters} className="chip">
          Reset filters
        </button>
      </div>

      {loading && <LoadingState />}
      {error && <ErrorState message={error} onRetry={refetch} />}
      {!loading && !error && doctors.length === 0 && (
        <NoDataState message="No doctors match the current filters, or no data has been loaded for this range yet." />
      )}
      {!loading && !error && doctors.length > 0 && <DoctorTable doctors={doctors} hospital={hospital} from={from} to={to} />}
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

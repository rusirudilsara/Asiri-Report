"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useApi } from "@/hooks/useApi";
import { LoadingState, ErrorState } from "@/components/StatusStates";
import { formatLKR } from "@/lib/formatting";
import type { DoctorMonthlyPoint } from "@/types";

function monthLabel(month: string): string {
  return new Date(month + "-01T00:00:00Z").toLocaleDateString("en-LK", { month: "short", year: "2-digit", timeZone: "UTC" });
}

export default function DrillThrough({ doctorCode, hospital, from, to }: { doctorCode: string; hospital: string; from: string; to: string }) {
  const url = `/api/doctor-performance/${encodeURIComponent(doctorCode)}/monthly?hospital=${encodeURIComponent(hospital)}&from=${from}&to=${to}`;
  const { data, loading, error, refetch } = useApi<{ months: DoctorMonthlyPoint[] }>(url);

  if (loading) return <LoadingState label="Loading monthly breakdown…" />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;

  const months = (data?.months ?? []).map((m) => ({ ...m, label: monthLabel(m.month) }));
  if (months.length === 0) return null;

  return (
    <div className="p-4" style={{ background: "var(--bg)" }}>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="card p-3" style={{ height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={months} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
              <CartesianGrid stroke="var(--border-soft)" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: "var(--text-faint)" }} axisLine={{ stroke: "var(--border)" }} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: "var(--text-faint)" }} axisLine={false} tickLine={false} tickFormatter={(v) => formatLKR(v, true)} />
              <Tooltip
                formatter={(value) => formatLKR(Number(value), true)}
                contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", fontSize: 12 }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="inpatientHospitalIncome" name="Inpatient" stackId="a" fill="var(--teal)" radius={[2, 2, 0, 0]} />
              <Bar dataKey="channelingHospitalIncome" name="Channeling" stackId="a" fill="var(--gold)" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card p-1 overflow-x-auto">
          <table className="table-shell">
            <thead>
              <tr>
                <th>Month</th>
                <th>Inpt. Income</th>
                <th>Chan. Income</th>
                <th>Total PF</th>
                <th>PF / Income</th>
              </tr>
            </thead>
            <tbody>
              {months.map((m) => (
                <tr key={m.month}>
                  <td>{m.label}</td>
                  <td className="num">{formatLKR(m.inpatientHospitalIncome, true)}</td>
                  <td className="num">{formatLKR(m.channelingHospitalIncome, true)}</td>
                  <td className="num">{formatLKR(m.totalProfessionalFee, true)}</td>
                  <td className="num">{m.totalHospitalIncome ? ((m.totalProfessionalFee / m.totalHospitalIncome) * 100).toFixed(1) : "0.0"}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

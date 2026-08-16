"use client";

import { Fragment, useMemo, useState } from "react";
import type { DoctorAggregate } from "@/types";
import { calcDoctorTotals } from "@/lib/calculations";
import { formatLKR, formatNumber } from "@/lib/formatting";
import DrillThrough from "./DrillThrough";

export default function DoctorTable({
  doctors,
  hospital,
  from,
  to,
}: {
  doctors: DoctorAggregate[];
  hospital: string;
  from: string;
  to: string;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);

  const bySpecialty = useMemo(() => {
    const map = new Map<string, DoctorAggregate[]>();
    for (const d of doctors) {
      const list = map.get(d.specialty) ?? [];
      list.push(d);
      map.set(d.specialty, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => {
        const ta = calcDoctorTotals(a).totalIncome;
        const tb = calcDoctorTotals(b).totalIncome;
        return tb - ta;
      });
    }
    return map;
  }, [doctors]);

  const grand = useMemo(() => sumDoctors(doctors), [doctors]);

  return (
    <div className="flex flex-col gap-4">
      {[...bySpecialty.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([specialty, rows]) => {
        const subtotal = sumDoctors(rows);
        return (
          <div key={specialty} className="card overflow-hidden">
            <div className="px-4 py-2.5 flex items-baseline justify-between" style={{ borderBottom: "1px solid var(--border-soft)" }}>
              <div className="font-display text-[14.5px]">{specialty}</div>
              <div className="text-[11px]" style={{ color: "var(--text-faint)" }}>
                {rows.length} consultant{rows.length > 1 ? "s" : ""} · {formatLKR(calcDoctorTotals(subtotal).totalIncome, true)} hospital income
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="table-shell">
                <thead>
                  <tr>
                    <th>Doctor</th>
                    <th>IP Count</th>
                    <th>IP Income</th>
                    <th>Income / Patient</th>
                    <th>Bookings</th>
                    <th>Ch. Income</th>
                    <th>Income / Booking</th>
                    <th>Total PF</th>
                    <th>Total Income</th>
                    <th>PF vs Income</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((d) => {
                    const t = calcDoctorTotals(d);
                    const isOpen = expanded === d.doctorCode;
                    return (
                      <Fragment key={d.doctorCode}>
                        <tr
                          className="cursor-pointer"
                          onClick={() => setExpanded(isOpen ? null : d.doctorCode)}
                        >
                          <td>
                            {d.doctorName}
                            <span className="text-[10px] ml-1.5" style={{ color: "var(--text-faint)" }}>
                              {isOpen ? "▾ hide monthly" : "▸ monthly"}
                            </span>
                          </td>
                          <td className="num">{d.inpatientCount}</td>
                          <td className="num">{formatLKR(d.inpatientHospitalIncome, true)}</td>
                          <td className="num">{formatLKR(t.incomePerPatient)}</td>
                          <td className="num">{d.channelingBookingCount}</td>
                          <td className="num">{formatLKR(d.channelingHospitalIncome, true)}</td>
                          <td className="num">{formatLKR(t.incomePerBooking)}</td>
                          <td className="num">{formatLKR(t.totalPF, true)}</td>
                          <td className="num">{formatLKR(t.totalIncome, true)}</td>
                          <td className="num">
                            <span className={`pill ${t.pfIncomeRatio > 0.4 ? "pill-warn" : "pill-good"}`}>
                              {(t.pfIncomeRatio * 100).toFixed(1)}%
                            </span>
                          </td>
                        </tr>
                        {isOpen && (
                          <tr>
                            <td colSpan={10} style={{ padding: 0 }}>
                              <DrillThrough doctorCode={d.doctorCode} hospital={hospital} from={from} to={to} />
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="total-row">
                    <td>TOTAL — {specialty}</td>
                    <td className="num">{subtotal.inpatientCount}</td>
                    <td className="num">{formatLKR(subtotal.inpatientHospitalIncome, true)}</td>
                    <td className="num">{formatLKR(subtotal.inpatientCount ? subtotal.inpatientHospitalIncome / subtotal.inpatientCount : 0)}</td>
                    <td className="num">{subtotal.channelingBookingCount}</td>
                    <td className="num">{formatLKR(subtotal.channelingHospitalIncome, true)}</td>
                    <td className="num">
                      {formatLKR(subtotal.channelingBookingCount ? subtotal.channelingHospitalIncome / subtotal.channelingBookingCount : 0)}
                    </td>
                    <td className="num">{formatLKR(calcDoctorTotals(subtotal).totalPF, true)}</td>
                    <td className="num">{formatLKR(calcDoctorTotals(subtotal).totalIncome, true)}</td>
                    <td className="num">{(calcDoctorTotals(subtotal).pfIncomeRatio * 100).toFixed(1)}%</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        );
      })}

      <div className="card p-3.5 flex items-center justify-between flex-wrap gap-2" style={{ background: "#123b33", borderColor: "var(--teal)" }}>
        <span className="font-display text-[14px]" style={{ color: "var(--teal-light)" }}>
          GRAND TOTAL
        </span>
        <span className="text-[12.5px] flex gap-5" style={{ color: "var(--text)" }}>
          <span>{formatNumber(grand.inpatientCount)} inpatients</span>
          <span>{formatNumber(grand.channelingBookingCount)} bookings</span>
          <span>Total PF {formatLKR(calcDoctorTotals(grand).totalPF, true)}</span>
          <span className="font-bold" style={{ color: "var(--teal-light)" }}>
            Total Income {formatLKR(calcDoctorTotals(grand).totalIncome, true)}
          </span>
        </span>
      </div>
    </div>
  );
}

function sumDoctors(rows: DoctorAggregate[]) {
  return rows.reduce(
    (acc, d) => ({
      inpatientCount: acc.inpatientCount + d.inpatientCount,
      inpatientProfessionalFee: acc.inpatientProfessionalFee + d.inpatientProfessionalFee,
      inpatientHospitalIncome: acc.inpatientHospitalIncome + d.inpatientHospitalIncome,
      channelingBookingCount: acc.channelingBookingCount + d.channelingBookingCount,
      channelingProfessionalFee: acc.channelingProfessionalFee + d.channelingProfessionalFee,
      channelingHospitalIncome: acc.channelingHospitalIncome + d.channelingHospitalIncome,
    }),
    {
      inpatientCount: 0,
      inpatientProfessionalFee: 0,
      inpatientHospitalIncome: 0,
      channelingBookingCount: 0,
      channelingProfessionalFee: 0,
      channelingHospitalIncome: 0,
    }
  );
}

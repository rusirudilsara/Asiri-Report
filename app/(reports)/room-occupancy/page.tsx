"use client";

import { useMemo, useState } from "react";
import { useApi } from "@/hooks/useApi";
import DateHospitalControls from "@/components/DateHospitalControls";
import OccupancyPill from "@/components/room-occupancy/OccupancyPill";
import { LoadingState, ErrorState, NoDataState, LastUpdated } from "@/components/StatusStates";
import { todayISO } from "@/lib/formatting";
import { calcRoomOccupancy, summarizeRoomOccupancy } from "@/lib/calculations";
import type { Hospital, RoomOccupancyRow } from "@/types";

export default function RoomOccupancyPage() {
  const [hospital, setHospital] = useState("ALL");
  const [date, setDate] = useState(todayISO());

  const { data: hospitalsData } = useApi<{ hospitals: Hospital[] }>("/api/hospitals");
  const hospitals = hospitalsData?.hospitals ?? [];

  const url = `/api/room-occupancy?hospital=${encodeURIComponent(hospital)}&date=${date}`;
  const { data, loading, error, refetch } = useApi<{ reportDate: string; rooms: RoomOccupancyRow[]; lastUpdated: string | null }>(url);

  const rooms = useMemo(() => data?.rooms ?? [], [data]);

  const byHospital = useMemo(() => {
    const map = new Map<string, RoomOccupancyRow[]>();
    for (const r of rooms) {
      const list = map.get(r.hospitalCode) ?? [];
      list.push(r);
      map.set(r.hospitalCode, list);
    }
    return map;
  }, [rooms]);

  const networkTotal = useMemo(() => summarizeRoomOccupancy(rooms, date), [rooms, date]);

  return (
    <div>
      <div className="mb-5">
        <h1 className="font-display text-xl">Room Occupancy Report</h1>
        <p className="text-[13px] mt-1" style={{ color: "var(--text-dim)" }}>
          Occupied hours ÷ available hours (Total Beds × 24, × days elapsed for MTD).
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
      {!loading && !error && rooms.length === 0 && (
        <NoDataState message="No Room Occupancy data has been loaded for this hospital and date yet." />
      )}

      {!loading && !error && rooms.length > 0 && (
        <>
          <div className="mb-3">
            <LastUpdated iso={data?.lastUpdated ?? null} />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-6">
            <SummaryCard label={hospital === "ALL" ? "Network Total Beds" : "Total Beds"} value={networkTotal.totalBeds.toLocaleString()} />
            <SummaryCard label="Occupied Beds (Day)" value={networkTotal.occupiedBedsDay.toLocaleString()} />
            <SummaryCard label="Vacant Beds (Day)" value={networkTotal.vacantBedsDay.toLocaleString()} />
            <SummaryCard
              label="Occupancy % (Day / MTD)"
              value={
                <span className="flex gap-1.5 items-baseline">
                  <OccupancyPill pct={networkTotal.occPctDay} />
                  <span className="text-[11px]" style={{ color: "var(--text-faint)" }}>
                    /
                  </span>
                  <OccupancyPill pct={networkTotal.occPctMTD} />
                </span>
              }
            />
          </div>

          {hospital === "ALL" ? (
            <AllHospitalsTable byHospital={byHospital} date={date} />
          ) : (
            <HospitalDetailTable rooms={rooms} date={date} />
          )}
        </>
      )}
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className="stat-value text-[18px]">{value}</div>
    </div>
  );
}

function AllHospitalsTable({ byHospital, date }: { byHospital: Map<string, RoomOccupancyRow[]>; date: string }) {
  const rows = [...byHospital.entries()].map(([code, rooms]) => ({
    code,
    name: rooms[0]?.hospitalName ?? code,
    summary: summarizeRoomOccupancy(rooms, date),
  }));

  return (
    <div className="card p-1 overflow-x-auto">
      <table className="table-shell">
        <thead>
          <tr>
            <th>Site</th>
            <th>Total Beds</th>
            <th>Occupied Beds (Day)</th>
            <th>Vacant Beds (Day)</th>
            <th>Occ % (Day)</th>
            <th>Occ % (MTD)</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.code}>
              <td>
                <b>{r.code}</b> — {r.name}
              </td>
              <td className="num">{r.summary.totalBeds}</td>
              <td className="num">{r.summary.occupiedBedsDay}</td>
              <td className="num">{r.summary.vacantBedsDay}</td>
              <td className="num">
                <OccupancyPill pct={r.summary.occPctDay} />
              </td>
              <td className="num">
                <OccupancyPill pct={r.summary.occPctMTD} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function HospitalDetailTable({ rooms, date }: { rooms: RoomOccupancyRow[]; date: string }) {
  const totals = summarizeRoomOccupancy(rooms, date);
  return (
    <div className="card p-1 overflow-x-auto">
      <table className="table-shell">
        <thead>
          <tr>
            <th>Room Category</th>
            <th>Total Beds</th>
            <th>Occ Beds</th>
            <th>Vacant</th>
            <th>Occ Hrs (Day)</th>
            <th>Avail Hrs (Day)</th>
            <th>Occ % (Day)</th>
            <th>Occ Hrs (MTD)</th>
            <th>Avail Hrs (MTD)</th>
            <th>Occ % (MTD)</th>
          </tr>
        </thead>
        <tbody>
          {rooms.map((r) => {
            const c = calcRoomOccupancy({
              totalBeds: r.totalBeds,
              occupiedBedsDay: r.occupiedBedsDay,
              occupiedHoursDay: r.occupiedHoursDay,
              occupiedHoursMTD: r.occupiedHoursMTD,
              reportDate: date,
            });
            return (
              <tr key={r.roomCode}>
                <td>
                  <span className="text-[10.5px]" style={{ color: "var(--text-faint)" }}>
                    {r.roomCode}
                  </span>{" "}
                  {r.roomCategory}
                </td>
                <td className="num">{r.totalBeds}</td>
                <td className="num">{r.occupiedBedsDay}</td>
                <td className="num">{c.vacantBedsDay}</td>
                <td className="num">{r.occupiedHoursDay}</td>
                <td className="num">{c.availableHoursDay}</td>
                <td className="num">
                  <OccupancyPill pct={c.occPctDay} />
                </td>
                <td className="num">{r.occupiedHoursMTD}</td>
                <td className="num">{c.availableHoursMTD}</td>
                <td className="num">
                  <OccupancyPill pct={c.occPctMTD} />
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="total-row">
            <td>TOTAL</td>
            <td className="num">{totals.totalBeds}</td>
            <td className="num">{totals.occupiedBedsDay}</td>
            <td className="num">{totals.vacantBedsDay}</td>
            <td className="num">{totals.occupiedHoursDay}</td>
            <td className="num">{totals.availableHoursDay}</td>
            <td className="num">
              <OccupancyPill pct={totals.occPctDay} />
            </td>
            <td className="num">{totals.occupiedHoursMTD}</td>
            <td className="num">{totals.availableHoursMTD}</td>
            <td className="num">
              <OccupancyPill pct={totals.occPctMTD} />
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

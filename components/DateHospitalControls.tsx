"use client";

import type { Hospital } from "@/types";
import HospitalSelector from "@/components/HospitalSelector";

export default function DateHospitalControls({
  hospitals,
  hospital,
  onHospitalChange,
  date,
  onDateChange,
  maxDate,
}: {
  hospitals: Hospital[];
  hospital: string;
  onHospitalChange: (code: string) => void;
  date: string;
  onDateChange: (date: string) => void;
  maxDate?: string;
}) {
  return (
    <div className="flex items-center gap-4 flex-wrap mb-5">
      <HospitalSelector hospitals={hospitals} value={hospital} onChange={onHospitalChange} />
      <div className="flex items-center gap-2 ml-auto">
        <label className="text-[11.5px] font-semibold" style={{ color: "var(--text-dim)" }}>
          Report date
        </label>
        <input
          type="date"
          value={date}
          max={maxDate}
          onChange={(e) => onDateChange(e.target.value)}
          className="input-field"
        />
      </div>
    </div>
  );
}

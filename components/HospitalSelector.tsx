"use client";

import type { Hospital } from "@/types";

export default function HospitalSelector({
  hospitals,
  value,
  onChange,
  includeAll = true,
}: {
  hospitals: Hospital[];
  value: string;
  onChange: (code: string) => void;
  includeAll?: boolean;
}) {
  return (
    <div className="flex gap-1.5 flex-wrap">
      {includeAll && (
        <div className={`chip ${value === "ALL" ? "active" : ""}`} onClick={() => onChange("ALL")}>
          All Hospitals
        </div>
      )}
      {hospitals.map((h) => (
        <div
          key={h.hospitalCode}
          className={`chip ${value === h.hospitalCode ? "active" : ""}`}
          onClick={() => onChange(h.hospitalCode)}
          title={h.hospitalName}
        >
          {h.hospitalCode}
        </div>
      ))}
    </div>
  );
}

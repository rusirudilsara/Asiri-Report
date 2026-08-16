import type { RagStatus } from "@/types";

/** Day-of-month for a given ISO date (YYYY-MM-DD), used for MTD available-hours math. */
export function dayOfMonth(isoDate: string): number {
  const d = new Date(isoDate + "T00:00:00Z");
  return d.getUTCDate();
}

export function availableHoursDay(totalBeds: number): number {
  return totalBeds * 24;
}

export function availableHoursMTD(totalBeds: number, isoDate: string): number {
  return totalBeds * 24 * dayOfMonth(isoDate);
}

export function occupancyPct(occupiedHours: number, availableHours: number): number {
  return availableHours > 0 ? (occupiedHours / availableHours) * 100 : 0;
}

/** Thresholds mirror the prototype reports: <70% low/teal, <90% mid/amber, else high/red. */
export function occupancyBand(pct: number): "low" | "mid" | "high" {
  if (Number.isNaN(pct)) return "low";
  if (pct < 70) return "low";
  if (pct < 90) return "mid";
  return "high";
}

export function variance(actual: number, reference: number): number {
  return actual - reference;
}

export function variancePct(actual: number, reference: number): number {
  if (!reference) return 0;
  return ((actual - reference) / reference) * 100;
}

/** RAG (red/amber/green) status for a comparison, respecting whether a lower value is the good outcome. */
export function ragStatus(actual: number, reference: number | null | undefined, lowerIsBetter: boolean): RagStatus {
  if (reference === null || reference === undefined) return "good";
  if (actual === reference) return "warn";
  const better = lowerIsBetter ? actual < reference : actual > reference;
  return better ? "good" : "bad";
}

export function deltaDirection(actual: number, reference: number | null | undefined, lowerIsBetter: boolean): "up" | "down" | "flat" {
  if (reference === null || reference === undefined || actual === reference) return "flat";
  const better = lowerIsBetter ? actual < reference : actual > reference;
  return better ? "up" : "down";
}

export interface RoomOccupancyCalc {
  vacantBedsDay: number;
  availableHoursDay: number;
  availableHoursMTD: number;
  occPctDay: number;
  occPctMTD: number;
}

export interface RoomOccupancySummary {
  totalBeds: number;
  occupiedBedsDay: number;
  vacantBedsDay: number;
  occupiedHoursDay: number;
  occupiedHoursMTD: number;
  availableHoursDay: number;
  availableHoursMTD: number;
  occPctDay: number;
  occPctMTD: number;
}

/** Sums a set of room rows (all belonging to one hospital and report date) into hospital-level totals. */
export function summarizeRoomOccupancy(
  rooms: { totalBeds: number; occupiedBedsDay: number; occupiedHoursDay: number; occupiedHoursMTD: number }[],
  reportDate: string
): RoomOccupancySummary {
  const totalBeds = rooms.reduce((s, r) => s + r.totalBeds, 0);
  const occupiedBedsDay = rooms.reduce((s, r) => s + r.occupiedBedsDay, 0);
  const occupiedHoursDay = rooms.reduce((s, r) => s + r.occupiedHoursDay, 0);
  const occupiedHoursMTD = rooms.reduce((s, r) => s + r.occupiedHoursMTD, 0);
  const availDay = availableHoursDay(totalBeds);
  const availMTD = availableHoursMTD(totalBeds, reportDate);
  return {
    totalBeds,
    occupiedBedsDay,
    vacantBedsDay: Math.max(0, totalBeds - occupiedBedsDay),
    occupiedHoursDay,
    occupiedHoursMTD,
    availableHoursDay: availDay,
    availableHoursMTD: availMTD,
    occPctDay: occupancyPct(occupiedHoursDay, availDay),
    occPctMTD: occupancyPct(occupiedHoursMTD, availMTD),
  };
}

export function calcRoomOccupancy(input: {
  totalBeds: number;
  occupiedBedsDay: number;
  occupiedHoursDay: number;
  occupiedHoursMTD: number;
  reportDate: string;
}): RoomOccupancyCalc {
  const availDay = availableHoursDay(input.totalBeds);
  const availMTD = availableHoursMTD(input.totalBeds, input.reportDate);
  return {
    vacantBedsDay: Math.max(0, input.totalBeds - input.occupiedBedsDay),
    availableHoursDay: availDay,
    availableHoursMTD: availMTD,
    occPctDay: occupancyPct(input.occupiedHoursDay, availDay),
    occPctMTD: occupancyPct(input.occupiedHoursMTD, availMTD),
  };
}

export interface DoctorTotals {
  totalPF: number;
  totalIncome: number;
  incomePerPatient: number;
  incomePerBooking: number;
  pfIncomeRatio: number;
  inChannelingRatio: number | null;
}

export function calcDoctorTotals(input: {
  inpatientCount: number;
  inpatientProfessionalFee: number;
  inpatientHospitalIncome: number;
  channelingBookingCount: number;
  channelingProfessionalFee: number;
  channelingHospitalIncome: number;
}): DoctorTotals {
  const totalPF = input.inpatientProfessionalFee + input.channelingProfessionalFee;
  const totalIncome = input.inpatientHospitalIncome + input.channelingHospitalIncome;
  return {
    totalPF,
    totalIncome,
    incomePerPatient: input.inpatientCount ? input.inpatientHospitalIncome / input.inpatientCount : 0,
    incomePerBooking: input.channelingBookingCount ? input.channelingHospitalIncome / input.channelingBookingCount : 0,
    pfIncomeRatio: totalIncome ? totalPF / totalIncome : 0,
    inChannelingRatio: input.channelingBookingCount ? input.inpatientCount / input.channelingBookingCount : null,
  };
}

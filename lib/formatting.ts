import type { MetricUnit } from "@/types";

export function formatLKR(value: number, compact = false): string {
  if (compact) {
    const abs = Math.abs(value);
    if (abs >= 1_000_000) return `Rs. ${(value / 1_000_000).toFixed(1)}M`;
    if (abs >= 1_000) return `Rs. ${(value / 1_000).toFixed(0)}K`;
    return `Rs. ${Math.round(value)}`;
  }
  return `Rs. ${Math.round(value).toLocaleString("en-LK")}`;
}

export function formatNumber(value: number, decimals = 0): string {
  return value.toLocaleString("en-LK", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

export function formatMetricValue(value: number, unit: MetricUnit, decimals = 0): string {
  switch (unit) {
    case "LKR":
      return formatLKR(value, true);
    case "%":
      return `${value}%`;
    case "min":
      return `${value} min`;
    case "hrs":
      return `${value} hrs`;
    case "days":
      return `${value} d`;
    case "kg":
      return `${value} kg`;
    default:
      return formatNumber(value, decimals);
  }
}

export function formatDate(isoDate: string): string {
  const d = new Date(isoDate + (isoDate.length === 10 ? "T00:00:00Z" : ""));
  return d.toLocaleDateString("en-LK", { year: "numeric", month: "short", day: "2-digit", timeZone: "UTC" });
}

export function formatDateTime(isoDateTime: string): string {
  const d = new Date(isoDateTime);
  return d.toLocaleString("en-LK", { year: "numeric", month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

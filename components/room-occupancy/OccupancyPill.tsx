import { occupancyBand } from "@/lib/calculations";
import { formatPercent } from "@/lib/formatting";

const BAND_CLASS: Record<string, string> = {
  low: "pill-good",
  mid: "pill-warn",
  high: "pill-bad",
};

export default function OccupancyPill({ pct }: { pct: number }) {
  return <span className={`pill ${BAND_CLASS[occupancyBand(pct)]}`}>{formatPercent(pct)}</span>;
}

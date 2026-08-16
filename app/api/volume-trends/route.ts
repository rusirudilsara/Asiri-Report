import { z } from "zod";
import { apiHandler, ALL_HOSPITALS } from "@/lib/apiHelpers";
import { query, withDb } from "@/lib/db";
import type { MetricUnit } from "@/types";

const monthRegex = /^\d{4}-\d{2}$/;
const querySchema = z.object({
  hospital: z.string().min(1).default(ALL_HOSPITALS),
  metricCode: z.string().min(1),
  from: z.string().regex(monthRegex, "from must be YYYY-MM"),
  to: z.string().regex(monthRegex, "to must be YYYY-MM"),
});

interface Row {
  MonthStart: string;
  Value: number;
  PriorYear: number | null;
  Unit: MetricUnit;
  MetricName: string;
  Category: string;
}

export async function GET(req: Request) {
  return apiHandler(async () => {
    const { searchParams } = new URL(req.url);
    const parsed = querySchema.parse({
      hospital: searchParams.get("hospital") ?? undefined,
      metricCode: searchParams.get("metricCode"),
      from: searchParams.get("from"),
      to: searchParams.get("to"),
    });

    const fromDate = `${parsed.from}-01`;
    // exclusive upper bound: first day of the month AFTER `to`
    const [toY, toM] = parsed.to.split("-").map(Number);
    const toExclusive = new Date(Date.UTC(toY, toM, 1)).toISOString().slice(0, 10);

    const rows = await withDb(() =>
      query<Row>(
        `SELECT DATEFROMPARTS(YEAR(dp.ReportDate), MONTH(dp.ReportDate), 1) AS MonthStart,
                CASE WHEN dp.Unit IN ('count','LKR') THEN SUM(dp.ActualValue) ELSE AVG(dp.ActualValue) END AS Value,
                CASE WHEN dp.Unit IN ('count','LKR') THEN SUM(dp.PriorYearValue) ELSE AVG(dp.PriorYearValue) END AS PriorYear,
                MAX(dp.Unit) AS Unit, MAX(dp.MetricName) AS MetricName, MAX(dp.Category) AS Category
         FROM dbo.DailyPerformance dp
         JOIN dbo.Hospitals h ON h.HospitalId = dp.HospitalId
         WHERE dp.MetricCode = @metricCode
           AND h.IsActive = 1
           AND (@hospital = 'ALL' OR h.HospitalCode = @hospital)
           AND dp.ReportDate >= @fromDate AND dp.ReportDate < @toExclusive
         GROUP BY YEAR(dp.ReportDate), MONTH(dp.ReportDate)
         ORDER BY MIN(dp.ReportDate)`,
        { metricCode: parsed.metricCode, hospital: parsed.hospital, fromDate, toExclusive }
      )
    );

    const months = rows.map((r) => ({
      month: new Date(r.MonthStart).toISOString().slice(0, 7),
      value: Number(r.Value),
      priorYearValue: r.PriorYear === null ? null : Number(r.PriorYear),
    }));

    const ytd = months.reduce((sum, m) => sum + m.value, 0);
    const priorYearYtd = months.every((m) => m.priorYearValue !== null)
      ? months.reduce((sum, m) => sum + (m.priorYearValue ?? 0), 0)
      : null;

    return {
      hospital: parsed.hospital,
      metricCode: parsed.metricCode,
      metricName: rows[0]?.MetricName ?? parsed.metricCode,
      category: rows[0]?.Category ?? "",
      unit: rows[0]?.Unit ?? "count",
      months,
      ytd,
      priorYearYtd,
      monthlyAverage: months.length ? ytd / months.length : 0,
    };
  });
}

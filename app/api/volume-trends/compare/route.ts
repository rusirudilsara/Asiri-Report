import { z } from "zod";
import { apiHandler } from "@/lib/apiHelpers";
import { query, withDb } from "@/lib/db";

const querySchema = z.object({
  metricCode: z.string().min(1),
  from: z.string().regex(/^\d{4}-\d{2}$/),
  to: z.string().regex(/^\d{4}-\d{2}$/),
});

interface Row {
  HospitalCode: string;
  HospitalName: string;
  Value: number;
}

/** Per-hospital totals for the selected metric/date range — feeds the "hospital comparison" view. */
export async function GET(req: Request) {
  return apiHandler(async () => {
    const { searchParams } = new URL(req.url);
    const parsed = querySchema.parse({
      metricCode: searchParams.get("metricCode"),
      from: searchParams.get("from"),
      to: searchParams.get("to"),
    });

    const fromDate = `${parsed.from}-01`;
    const [toY, toM] = parsed.to.split("-").map(Number);
    const toExclusive = new Date(Date.UTC(toY, toM, 1)).toISOString().slice(0, 10);

    const rows = await withDb(() =>
      query<Row>(
        `SELECT h.HospitalCode, h.HospitalName,
                CASE WHEN MAX(dp.Unit) IN ('count','LKR') THEN SUM(dp.ActualValue) ELSE AVG(dp.ActualValue) END AS Value
         FROM dbo.DailyPerformance dp
         JOIN dbo.Hospitals h ON h.HospitalId = dp.HospitalId
         WHERE dp.MetricCode = @metricCode
           AND h.IsActive = 1
           AND dp.ReportDate >= @fromDate AND dp.ReportDate < @toExclusive
         GROUP BY h.HospitalCode, h.HospitalName, h.SortOrder
         ORDER BY h.SortOrder`,
        { metricCode: parsed.metricCode, fromDate, toExclusive }
      )
    );

    return {
      metricCode: parsed.metricCode,
      hospitals: rows.map((r) => ({ hospitalCode: r.HospitalCode, hospitalName: r.HospitalName, value: Number(r.Value) })),
    };
  });
}

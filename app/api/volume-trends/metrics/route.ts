import { apiHandler } from "@/lib/apiHelpers";
import { query, withDb } from "@/lib/db";
import type { MetricUnit } from "@/types";

interface Row {
  Category: string;
  MetricCode: string;
  MetricName: string;
  Unit: MetricUnit;
}

export async function GET() {
  return apiHandler(async () => {
    const rows = await withDb(() =>
      query<Row>(
        `SELECT DISTINCT Category, MetricCode, MetricName, Unit
         FROM dbo.DailyPerformance
         ORDER BY Category, MetricName`
      )
    );
    const metrics = rows.map((r) => ({
      category: r.Category,
      metricCode: r.MetricCode,
      metricName: r.MetricName,
      unit: r.Unit,
    }));
    return { metrics };
  });
}

import { z } from "zod";
import { apiHandler, ALL_HOSPITALS } from "@/lib/apiHelpers";
import { query, withDb } from "@/lib/db";
import { aggregateToAllHospitals } from "@/lib/aggregateMetrics";
import type { DailyPerformanceMetric } from "@/types";

const querySchema = z.object({
  hospital: z.string().min(1).default(ALL_HOSPITALS),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD"),
});

interface Row {
  ReportDate: string;
  HospitalId: number;
  HospitalCode: string;
  HospitalName: string;
  Category: string;
  MetricCode: string;
  MetricName: string;
  Unit: DailyPerformanceMetric["unit"];
  ActualValue: number;
  MTDValue: number | null;
  TargetValue: number | null;
  BudgetValue: number | null;
  PriorMonthValue: number | null;
  PriorYearValue: number | null;
  LowerIsBetter: boolean;
  SortOrder: number;
  UpdatedAt: string;
}

export async function GET(req: Request) {
  return apiHandler(async () => {
    const { searchParams } = new URL(req.url);
    const parsed = querySchema.parse({
      hospital: searchParams.get("hospital") ?? undefined,
      date: searchParams.get("date"),
    });

    const rows = await withDb(() =>
      query<Row>(
        `SELECT dp.ReportDate, dp.HospitalId, h.HospitalCode, h.HospitalName, dp.Category, dp.MetricCode, dp.MetricName,
                dp.Unit, dp.ActualValue, dp.MTDValue, dp.TargetValue, dp.BudgetValue, dp.PriorMonthValue, dp.PriorYearValue,
                dp.LowerIsBetter, dp.SortOrder, dp.UpdatedAt
         FROM dbo.DailyPerformance dp
         JOIN dbo.Hospitals h ON h.HospitalId = dp.HospitalId
         WHERE dp.ReportDate = @date
           AND h.IsActive = 1
           AND (@hospital = 'ALL' OR h.HospitalCode = @hospital)
         ORDER BY dp.Category, dp.SortOrder, h.SortOrder`,
        { date: parsed.date, hospital: parsed.hospital }
      )
    );

    const mapped: DailyPerformanceMetric[] = rows.map((r) => ({
      reportDate: parsed.date,
      hospitalId: r.HospitalId,
      hospitalCode: r.HospitalCode,
      hospitalName: r.HospitalName,
      category: r.Category,
      metricCode: r.MetricCode,
      metricName: r.MetricName,
      unit: r.Unit,
      actualValue: Number(r.ActualValue),
      mtdValue: r.MTDValue === null ? null : Number(r.MTDValue),
      targetValue: r.TargetValue === null ? null : Number(r.TargetValue),
      budgetValue: r.BudgetValue === null ? null : Number(r.BudgetValue),
      priorMonthValue: r.PriorMonthValue === null ? null : Number(r.PriorMonthValue),
      priorYearValue: r.PriorYearValue === null ? null : Number(r.PriorYearValue),
      lowerIsBetter: Boolean(r.LowerIsBetter),
      sortOrder: r.SortOrder,
      updatedAt: r.UpdatedAt,
    }));

    const result = parsed.hospital === ALL_HOSPITALS ? aggregateToAllHospitals(mapped) : mapped;

    return {
      reportDate: parsed.date,
      hospital: parsed.hospital,
      metrics: result,
      lastUpdated: mapped.reduce<string | null>((max, r) => (!max || r.updatedAt > max ? r.updatedAt : max), null),
    };
  });
}

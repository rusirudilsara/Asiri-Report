import { z } from "zod";
import { apiHandler, ALL_HOSPITALS, HttpError } from "@/lib/apiHelpers";
import { query, withDb } from "@/lib/db";
import type { DoctorMonthlyPoint } from "@/types";

const querySchema = z.object({
  hospital: z.string().min(1).default(ALL_HOSPITALS),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

interface Row {
  MonthStart: string;
  InIncome: number;
  ChIncome: number;
  TotalPF: number;
}
interface DoctorRow {
  DoctorName: string;
  Specialty: string;
}

export async function GET(req: Request, ctx: RouteContext<"/api/doctor-performance/[code]/monthly">) {
  return apiHandler(async () => {
    const { code } = await ctx.params;
    const { searchParams } = new URL(req.url);
    const parsed = querySchema.parse({
      hospital: searchParams.get("hospital") ?? undefined,
      from: searchParams.get("from"),
      to: searchParams.get("to"),
    });

    const [doctorInfo, rows] = await withDb(() =>
      Promise.all([
        query<DoctorRow>(
          `SELECT TOP 1 DoctorName, Specialty FROM dbo.DoctorPerformance WHERE DoctorCode = @code`,
          { code }
        ),
        query<Row>(
          `SELECT DATEFROMPARTS(YEAR(dp.ReportDate), MONTH(dp.ReportDate), 1) AS MonthStart,
                  SUM(dp.InpatientHospitalIncome) AS InIncome,
                  SUM(dp.ChannelingHospitalIncome) AS ChIncome,
                  SUM(dp.InpatientProfessionalFee + dp.ChannelingProfessionalFee) AS TotalPF
           FROM dbo.DoctorPerformance dp
           JOIN dbo.Hospitals h ON h.HospitalId = dp.HospitalId
           WHERE dp.DoctorCode = @code
             AND dp.ReportDate BETWEEN @from AND @to
             AND (@hospital = 'ALL' OR h.HospitalCode = @hospital)
           GROUP BY YEAR(dp.ReportDate), MONTH(dp.ReportDate)
           ORDER BY MIN(dp.ReportDate)`,
          { code, from: parsed.from, to: parsed.to, hospital: parsed.hospital }
        ),
      ])
    );

    if (doctorInfo.length === 0) {
      throw new HttpError("Doctor not found.", 404);
    }

    const months: DoctorMonthlyPoint[] = rows.map((r) => {
      const inInc = Number(r.InIncome);
      const chInc = Number(r.ChIncome);
      return {
        month: new Date(r.MonthStart).toISOString().slice(0, 7),
        inpatientHospitalIncome: inInc,
        channelingHospitalIncome: chInc,
        totalProfessionalFee: Number(r.TotalPF),
        totalHospitalIncome: inInc + chInc,
      };
    });

    return {
      doctorCode: code,
      doctorName: doctorInfo[0].DoctorName,
      specialty: doctorInfo[0].Specialty,
      months,
    };
  });
}

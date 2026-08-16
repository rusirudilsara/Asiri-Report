import { z } from "zod";
import { apiHandler, ALL_HOSPITALS, HttpError } from "@/lib/apiHelpers";
import { query, withDb } from "@/lib/db";
import type { DoctorAggregate } from "@/types";

const ALL_SPECIALTIES = "ALL";

const querySchema = z.object({
  hospital: z.string().min(1).default(ALL_HOSPITALS),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  specialty: z.string().min(1).default(ALL_SPECIALTIES),
  search: z.string().default(""),
});

interface Row {
  DoctorCode: string;
  DoctorName: string;
  Specialty: string;
  InpatientCount: number;
  InpatientProfessionalFee: number;
  InpatientHospitalIncome: number;
  ChannelingBookingCount: number;
  ChannelingProfessionalFee: number;
  ChannelingHospitalIncome: number;
}

export async function GET(req: Request) {
  return apiHandler(async () => {
    const { searchParams } = new URL(req.url);
    const parsed = querySchema.parse({
      hospital: searchParams.get("hospital") ?? undefined,
      from: searchParams.get("from"),
      to: searchParams.get("to"),
      specialty: searchParams.get("specialty") ?? undefined,
      search: searchParams.get("search") ?? undefined,
    });

    if (parsed.from > parsed.to) {
      throw new HttpError("`from` date must not be after `to` date.", 400);
    }

    const rows = await withDb(() =>
      query<Row>(
        `SELECT dp.DoctorCode, dp.DoctorName, dp.Specialty,
                SUM(dp.InpatientCount) AS InpatientCount,
                SUM(dp.InpatientProfessionalFee) AS InpatientProfessionalFee,
                SUM(dp.InpatientHospitalIncome) AS InpatientHospitalIncome,
                SUM(dp.ChannelingBookingCount) AS ChannelingBookingCount,
                SUM(dp.ChannelingProfessionalFee) AS ChannelingProfessionalFee,
                SUM(dp.ChannelingHospitalIncome) AS ChannelingHospitalIncome
         FROM dbo.DoctorPerformance dp
         JOIN dbo.Hospitals h ON h.HospitalId = dp.HospitalId
         WHERE dp.ReportDate BETWEEN @from AND @to
           AND h.IsActive = 1
           AND (@hospital = 'ALL' OR h.HospitalCode = @hospital)
           AND (@specialty = 'ALL' OR dp.Specialty = @specialty)
           AND (@search = '' OR dp.DoctorName LIKE '%' + @search + '%' OR dp.Specialty LIKE '%' + @search + '%')
         GROUP BY dp.DoctorCode, dp.DoctorName, dp.Specialty
         ORDER BY dp.Specialty, dp.DoctorName`,
        {
          from: parsed.from,
          to: parsed.to,
          hospital: parsed.hospital,
          specialty: parsed.specialty,
          search: parsed.search,
        }
      )
    );

    const doctors: DoctorAggregate[] = rows.map((r) => ({
      doctorCode: r.DoctorCode,
      doctorName: r.DoctorName,
      specialty: r.Specialty,
      inpatientCount: Number(r.InpatientCount),
      inpatientProfessionalFee: Number(r.InpatientProfessionalFee),
      inpatientHospitalIncome: Number(r.InpatientHospitalIncome),
      channelingBookingCount: Number(r.ChannelingBookingCount),
      channelingProfessionalFee: Number(r.ChannelingProfessionalFee),
      channelingHospitalIncome: Number(r.ChannelingHospitalIncome),
    }));

    return { from: parsed.from, to: parsed.to, hospital: parsed.hospital, doctors };
  });
}

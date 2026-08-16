import { apiHandler } from "@/lib/apiHelpers";
import { query, withDb } from "@/lib/db";
import type { Hospital } from "@/types";

export async function GET() {
  return apiHandler(async () => {
    const rows = await withDb(() =>
      query<{
        HospitalId: number;
        HospitalCode: string;
        HospitalName: string;
        City: string | null;
        SortOrder: number;
      }>(
        `SELECT HospitalId, HospitalCode, HospitalName, City, SortOrder
         FROM dbo.Hospitals
         WHERE IsActive = 1
         ORDER BY SortOrder, HospitalName`
      )
    );
    const hospitals: Hospital[] = rows.map((r) => ({
      hospitalId: r.HospitalId,
      hospitalCode: r.HospitalCode,
      hospitalName: r.HospitalName,
      city: r.City,
      sortOrder: r.SortOrder,
    }));
    return { hospitals };
  });
}

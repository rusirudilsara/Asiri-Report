import { z } from "zod";
import { apiHandler, ALL_HOSPITALS } from "@/lib/apiHelpers";
import { query, withDb } from "@/lib/db";
import type { RoomOccupancyRow } from "@/types";

const querySchema = z.object({
  hospital: z.string().min(1).default(ALL_HOSPITALS),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD"),
});

interface Row {
  ReportDate: string;
  HospitalId: number;
  HospitalCode: string;
  HospitalName: string;
  RoomCode: string;
  RoomCategory: string;
  TotalBeds: number;
  OccupiedBedsDay: number;
  OccupiedHoursDay: number;
  OccupiedHoursMTD: number;
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
        `SELECT ro.ReportDate, ro.HospitalId, h.HospitalCode, h.HospitalName, ro.RoomCode, ro.RoomCategory,
                ro.TotalBeds, ro.OccupiedBedsDay, ro.OccupiedHoursDay, ro.OccupiedHoursMTD, ro.UpdatedAt
         FROM dbo.RoomOccupancy ro
         JOIN dbo.Hospitals h ON h.HospitalId = ro.HospitalId
         WHERE ro.ReportDate = @date
           AND h.IsActive = 1
           AND (@hospital = 'ALL' OR h.HospitalCode = @hospital)
         ORDER BY h.SortOrder, ro.RoomCategory`,
        { date: parsed.date, hospital: parsed.hospital }
      )
    );

    const rooms: RoomOccupancyRow[] = rows.map((r) => ({
      reportDate: parsed.date,
      hospitalId: r.HospitalId,
      hospitalCode: r.HospitalCode,
      hospitalName: r.HospitalName,
      roomCode: r.RoomCode,
      roomCategory: r.RoomCategory,
      totalBeds: r.TotalBeds,
      occupiedBedsDay: r.OccupiedBedsDay,
      occupiedHoursDay: Number(r.OccupiedHoursDay),
      occupiedHoursMTD: Number(r.OccupiedHoursMTD),
      updatedAt: r.UpdatedAt,
    }));

    return {
      reportDate: parsed.date,
      hospital: parsed.hospital,
      rooms,
      lastUpdated: rooms.reduce<string | null>((max, r) => (!max || r.updatedAt > max ? r.updatedAt : max), null),
    };
  });
}

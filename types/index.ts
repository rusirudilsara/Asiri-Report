export interface Hospital {
  hospitalId: number;
  hospitalCode: string;
  hospitalName: string;
  city: string | null;
  sortOrder: number;
}

export type MetricUnit = "count" | "LKR" | "%" | "days" | "min" | "hrs" | "kg" | "ratio";

export interface DailyPerformanceMetric {
  reportDate: string;
  hospitalId: number;
  hospitalCode: string;
  hospitalName: string;
  category: string;
  metricCode: string;
  metricName: string;
  unit: MetricUnit;
  actualValue: number; // "Day" value
  mtdValue: number | null;
  targetValue: number | null;
  budgetValue: number | null;
  priorMonthValue: number | null; // "Cum LM"
  priorYearValue: number | null;
  lowerIsBetter: boolean;
  sortOrder: number;
  updatedAt: string;
}

export interface RoomOccupancyRow {
  reportDate: string;
  hospitalId: number;
  hospitalCode: string;
  hospitalName: string;
  roomCode: string;
  roomCategory: string;
  totalBeds: number;
  occupiedBedsDay: number;
  occupiedHoursDay: number;
  occupiedHoursMTD: number;
  updatedAt: string;
}

export interface DoctorPerformanceRow {
  reportDate: string;
  hospitalId: number;
  hospitalCode: string;
  hospitalName: string;
  doctorCode: string;
  doctorName: string;
  specialty: string;
  inpatientCount: number;
  inpatientProfessionalFee: number;
  inpatientHospitalIncome: number;
  channelingBookingCount: number;
  channelingProfessionalFee: number;
  channelingHospitalIncome: number;
  updatedAt: string;
}

export interface DoctorAggregate {
  doctorCode: string;
  doctorName: string;
  specialty: string;
  inpatientCount: number;
  inpatientProfessionalFee: number;
  inpatientHospitalIncome: number;
  channelingBookingCount: number;
  channelingProfessionalFee: number;
  channelingHospitalIncome: number;
}

export interface DoctorMonthlyPoint {
  month: string; // YYYY-MM
  inpatientHospitalIncome: number;
  channelingHospitalIncome: number;
  totalProfessionalFee: number;
  totalHospitalIncome: number;
}

export interface ApiError {
  error: string;
}

export type RagStatus = "good" | "warn" | "bad";

import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { DatabaseUnavailableError } from "@/lib/db";

export class HttpError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "HttpError";
    this.status = status;
  }
}

/** Wraps a route handler body so every route gets the same error-shape behavior (section 11 of the brief). */
export async function apiHandler<T>(fn: () => Promise<T>): Promise<NextResponse> {
  try {
    const data = await fn();
    return NextResponse.json(data);
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ error: "Invalid request parameters.", details: err.issues }, { status: 400 });
    }
    if (err instanceof DatabaseUnavailableError) {
      return NextResponse.json({ error: err.message }, { status: 503 });
    }
    if (err instanceof HttpError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error(err);
    return NextResponse.json({ error: "Unexpected server error." }, { status: 500 });
  }
}

export const ALL_HOSPITALS = "ALL";

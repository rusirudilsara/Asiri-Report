import sql from "mssql";

/**
 * Server-only SQL Server connection pool. Never import this file from a
 * "use client" component — the app router will fail the build if you try,
 * since `mssql` depends on Node APIs that don't exist in the browser.
 */

const config: sql.config = {
  server: requireEnv("DB_SERVER"),
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 1433,
  database: requireEnv("DB_NAME"),
  user: requireEnv("DB_USER"),
  password: requireEnv("DB_PASSWORD"),
  options: {
    encrypt: process.env.DB_ENCRYPT !== "false",
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERT === "true",
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
  requestTimeout: 30000,
};

function requireEnv(name: string): string {
  const val = process.env[name];
  if (!val) {
    throw new Error(
      `Missing required environment variable ${name}. Copy .env.example to .env.local and fill in your SQL Server connection details.`
    );
  }
  return val;
}

declare global {
  var __asiriSqlPool: sql.ConnectionPool | undefined;
  var __asiriSqlPoolPromise: Promise<sql.ConnectionPool> | undefined;
}

function getPool(): Promise<sql.ConnectionPool> {
  if (global.__asiriSqlPool?.connected) {
    return Promise.resolve(global.__asiriSqlPool);
  }
  if (!global.__asiriSqlPoolPromise) {
    const pool = new sql.ConnectionPool(config);
    global.__asiriSqlPool = pool;
    global.__asiriSqlPoolPromise = pool.connect().catch((err: unknown) => {
      // Allow a subsequent call to retry instead of caching a rejected connection forever
      global.__asiriSqlPoolPromise = undefined;
      throw err;
    });
  }
  return global.__asiriSqlPoolPromise as Promise<sql.ConnectionPool>;
}

export type SqlParams = Record<string, { type: () => sql.ISqlType; value: unknown } | string | number | boolean | Date | null>;

/**
 * Runs a parameterized query and returns the recordset rows.
 * Always pass user-controlled values through `params` — never string-concatenate
 * them into `queryText` (SQL injection).
 */
export async function query<T = Record<string, unknown>>(
  queryText: string,
  params: SqlParams = {}
): Promise<T[]> {
  const pool = await getPool();
  const request = pool.request();
  for (const [key, val] of Object.entries(params)) {
    if (val !== null && typeof val === "object" && "type" in val && "value" in val) {
      request.input(key, val.type(), val.value);
    } else {
      request.input(key, val);
    }
  }
  const result = await request.query<T>(queryText);
  return result.recordset;
}

export { sql };

export class DatabaseUnavailableError extends Error {
  constructor(cause: unknown) {
    super("Unable to reach the reporting database. Please try again shortly.");
    this.name = "DatabaseUnavailableError";
    this.cause = cause;
  }
}

/** Wrap a DB call so route handlers can distinguish connectivity failures from empty results. */
export async function withDb<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    throw new DatabaseUnavailableError(err);
  }
}

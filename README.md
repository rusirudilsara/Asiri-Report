# Asiri Health — Daily Reporting System (MVP)

An internal Next.js web app that replaces the four hardcoded/manually-edited
HTML reports (`Asiri_Health_Daily_Performance_webReport.html`, `Asiri_Room_Occupancy_Report.html`,
`Doctor_Performance_Dashboard.html`, `volume_trends_asiri_surgical.html`) with a single
database-backed application, per the MVP requirement brief.

This is a proof of concept for a management/IT demonstration — not the final
production system. See [section 13](#out-of-scope-for-this-mvp) for what's
deliberately left for the company IT team.

## Tech stack

- Next.js 16 (App Router) + React 19 + TypeScript
- Microsoft SQL Server via `mssql`, queried only from Next.js Route Handlers (server-side)
- Recharts for charts
- Zod for request validation
- A minimal cookie-based session (no third-party auth service) — see [Authentication](#authentication)

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in real values, see below
npm run dev
```

The app redirects `/` → `/dashboard`, and every report route is behind a login at `/login`.

### 1. Database

Run the scripts in `sql/` **in order** against a SQL Server instance:

| Script | Purpose |
|---|---|
| `000_readonly_login.sql` | Creates a dedicated read-only SQL login for the app (section 12 of the brief). Change the placeholder password before running. |
| `001_schema.sql` | Creates the `Hospitals`, `DailyPerformance`, `RoomOccupancy`, `DoctorPerformance` tables. |
| `002_seed_hospitals.sql` | The six Asiri hospitals. |
| `003_seed_daily_performance.sql` | ~66 days × 6 hospitals × 46 sample KPIs for the Daily Performance report. |
| `004_seed_room_occupancy.sql` | Room/bed data seeded from the real room inventory in the original Room Occupancy prototype. |
| `005_seed_doctor_performance.sql` | 30 illustrative doctors across 10 specialties, daily grain. |

All seed scripts are idempotent (safe to re-run) and generate **illustrative sample
data only** — they exist so the app has something realistic to display before the
company IT team wires up the real nightly ETL described in section 3 of the brief.

> These scripts were authored and reviewed for correctness but not executed against
> a live SQL Server in this environment (none was available). A DBA should dry-run
> them against a scratch database before pointing the app at production.

### 2. Environment variables

Copy `.env.example` → `.env.local` and fill in:

- `DB_SERVER`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` — point at the SQL
  login created by `000_readonly_login.sql`.
- `AUTH_SECRET` — generate with `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`.
- `APP_USERS` — the handful of approved users (section 7 of the brief). Generate
  each bcrypt hash with `node scripts/hash-password.js "their password"`.
  **Escape every `$` in the hash as `\$`** — Next.js expands `$VAR`-style
  references in `.env` files, and bcrypt hashes always contain `$`.

A working demo login is already set up in `.env.local` if you generated one while
testing locally (`demo@asirihealth.com` / `Demo123!`) — replace it with real users
before sharing the app.

## Architecture

```
app/
  login/                  Public login page
  (reports)/              Everything behind auth, shares Navigation via layout.tsx
    dashboard/             Daily Performance Report  (8.1)
    room-occupancy/         Room Occupancy Report     (8.2)
    doctor-performance/      Doctor Performance Dashboard (8.3)
    volume-trends/            Volume Trends Report     (8.4)
  api/                     Route Handlers — the ONLY code that talks to SQL Server
    auth/login, auth/logout
    hospitals
    daily-performance
    room-occupancy
    doctor-performance, doctor-performance/[code]/monthly
    volume-trends, volume-trends/metrics, volume-trends/compare
lib/
  db.ts                   SQL Server connection pool + parameterized query() helper
  calculations.ts          Occupancy %, variance %, RAG status — pure functions, unit-testable
  formatting.ts             LKR / number / date formatting
  aggregateMetrics.ts        Rolls per-hospital rows up to "All Hospitals"
  session.ts, users.ts, getSession.ts   Auth
sql/                      Schema + seed scripts (see above)
proxy.ts                  Route protection (Next.js's evolution of "middleware")
```

**The browser never talks to SQL Server directly** (section 6 of the brief) — every
page is a Client Component that calls the app's own `/api/*` routes via `fetch`,
and only those Route Handlers import `lib/db.ts`.

### Why `DailyPerformance` is one generic table, not sixteen

The Daily Performance Report prototype has ~16 sections (Executive Summary,
Patient Experience, Channeling, Theatre, Laboratory, Dental, Physiotherapy, IVF,
Home Nursing, Amazing Care, Pharmacy, Clinical Units × several, Equipment,
Finance...). Modeling each as its own table/page would mean an app code change
every time the company wants to light up a new section — but the brief is
explicit that "only sections for which data is available need to be connected
in the initial MVP."

Instead, `dbo.DailyPerformance` is one table keyed by
`(ReportDate, HospitalId, MetricCode)` with a `Category` column. The dashboard
groups whatever rows exist for a date/hospital by `Category` and renders one
collapsible section per category, with `Executive Summary` and `Snapshot`
special-cased as headline stat cards. **To add a new report section, the IT
team just inserts rows with a new `Category` value — no code change required.**
See the `METRICS` array in the (scratch) seed generator for the full set of
categories/metrics currently wired up, or query
`SELECT DISTINCT Category, MetricCode, MetricName, Unit FROM DailyPerformance`.

### Authentication

Section 7 of the brief only calls for "a basic protected login" for a handful of
named users — no self-service signup, no RBAC, no AD integration. Rather than
pull in a full auth framework, `lib/session.ts` implements a minimal signed
session cookie (HMAC-SHA256 via the Web Crypto API, so the same code runs in
both Node.js Route Handlers and the Edge `proxy.ts`). Approved users live in the
`APP_USERS` environment variable (bcrypt-hashed passwords) — not a database
table — so the read-only DB account (section 12) never needs write access for
login, and auth still works even if SQL Server is temporarily unreachable.

`proxy.ts` (Next.js 16's renamed "middleware") blocks every route except
`/login` and `/api/auth/*` unless a valid session cookie is present; API routes
get a `401 JSON` response, page routes redirect to `/login`.

### Error / empty / loading states (brief section 9)

`hooks/useApi.ts` is a small shared fetch hook used by every report page; it
exposes `loading` / `error` / `data`, and `components/StatusStates.tsx` renders
consistent loading spinners, retryable error banners, and "no data" messaging
across all four reports. `LastUpdated` surfaces the most recent `UpdatedAt`
timestamp from the underlying rows.

## Calculation notes (confirm these with your friend / the business team — section 8.2 of the brief flags this explicitly)

- **Room Occupancy %** = Occupied Hours ÷ Available Hours, where Available
  Hours (Day) = `TotalBeds × 24` and Available Hours (MTD) = `TotalBeds × 24 ×
  day-of-month`. `OccupiedHoursMTD` is stored directly per row (supplied by the
  daily import), matching how the original prototype's inputs worked — it is
  **not** derived by summing daily deltas inside the app.
- **"All Hospitals" rollups** for Daily Performance metrics: count/LKR
  (additive) metrics are **summed** across hospitals; rate-style metrics (%,
  days, min, hrs, kg, ratio) are a **simple average** across the hospitals
  reporting that metric that day (not bed-weighted, since `DailyPerformance`
  doesn't carry a bed count). See `lib/aggregateMetrics.ts`.
- **Volume Trends** monthly values are aggregated straight from
  `DailyPerformance.ActualValue` (SUM for additive units, AVG for rate units)
  — there is no separate volume-trends table, per section 10 of the brief.
- **Doctor income splits** (`Income/Patient`, `Income/Booking`, `PF vs
  Income`) follow the same formulas as the original Doctor Performance
  Dashboard prototype; see `lib/calculations.ts::calcDoctorTotals`.

## What was verified in this environment

- `npm run build` and `npm run lint` both pass cleanly.
- The app was run with `npm run dev` and walked through manually: login,
  logout, protected-route redirect (both page and API routes return the
  correct 401/redirect when unauthenticated), navigation between all four
  reports, and the loading/error-state UI (since no live SQL Server was
  available here, every data fetch correctly surfaced the "couldn't load this
  report" state with a working Retry button, rather than crashing).
- **Not verified here**: the SQL scripts against a real SQL Server, and the
  reports actually rendering real data end-to-end. Please run `sql/000`
  through `sql/005` against a real instance, point `.env.local` at it, and
  confirm the four report pages populate before the management demo.

## Acceptance criteria (section 16 of the brief)

| Criterion | Status |
|---|---|
| A user can log in | ✅ |
| A hospital can be selected | ✅ (chip selector on every report) |
| A report date / date range can be selected | ✅ |
| Actual values retrieved from SQL Server | ✅ (pending IT populating real data) |
| The four main report pages load successfully | ✅ (verified UI shell + error states; needs a live DB to confirm data rendering) |
| Daily and month-to-date values correctly displayed | ✅ (formulas above; needs business sign-off on exact metric definitions) |
| Comparisons match available database data | ✅ (Budget/Target/Cum LM/Prior Year, where the metric defines them) |
| Missing information handled clearly | ✅ (loading / error / no-data states throughout) |
| Database credentials not exposed to the browser | ✅ (all SQL access is server-only; verified via file boundaries + build) |
| Ready to demonstrate | ⚠️ needs real SQL Server + data before the live demo |

## Out of scope for this MVP

Per section 13 of the brief: role-based authorization, full user management,
an admin dashboard, manual data entry, patient records, notifications,
approval workflows, a mobile app, real-time streaming, report scheduling, and
a custom report builder are all intentionally not implemented.

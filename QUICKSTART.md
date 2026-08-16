# Quick Start — for whoever sets up the server

You've been given the `Asiri Report` project folder. Here's everything you need to do to get it running with your own SQL Server.

## 1. Install prerequisites

- [Node.js](https://nodejs.org) 20 or newer
- Access to a Microsoft SQL Server instance (existing or new) where you can create a database

## 2. Install the app's dependencies

Open a terminal in the project folder and run:

```bash
npm install
```

## 3. Set up the database

In SQL Server Management Studio (or `sqlcmd`), create an empty database, e.g. `AsiriDailyReport`. Then run the scripts in the `sql/` folder **in this exact order**, against that database:

1. `sql/000_readonly_login.sql` — creates a dedicated login for the app. **Open it first and change the placeholder password** on the `CREATE LOGIN` line.
2. `sql/001_schema.sql` — creates the tables.
3. `sql/002_seed_hospitals.sql`
4. `sql/003_seed_daily_performance.sql`
5. `sql/004_seed_room_occupancy.sql`
6. `sql/005_seed_doctor_performance.sql`

Scripts 2–6 load sample data so the reports have something to display immediately. They're safe to re-run.

## 4. Configure the app

Copy the example config and edit it:

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in:

- **`DB_SERVER` / `DB_PORT` / `DB_NAME` / `DB_USER` / `DB_PASSWORD`** — the SQL Server address and the login you created/changed in step 3.
- **`AUTH_SECRET`** — generate one and paste it in:
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
  ```
- **`APP_USERS`** — who's allowed to log in. For each person:
  ```bash
  node scripts/hash-password.js "ThatPersonsPassword"
  ```
  Paste the output as `passwordHash` in the `APP_USERS` JSON array, alongside their `email` and `name`. You can list more than one person in the array.

  ⚠️ **Important:** every bcrypt hash contains `$` characters (e.g. `$2b$10$...`). In `.env.local`, escape each one as `\$` or the app won't be able to read it correctly. The example in the file already shows the right format — just replace the hash itself, keeping the backslashes.

## 5. Run it

```bash
npm run dev
```

Open **http://localhost:3000** — it redirects to the login page. Sign in with one of the users you set up in step 4.

If a report page shows "Couldn't load this report," it means the app can't reach SQL Server yet — double-check the `DB_*` values in `.env.local` and that the login from step 3 has access to the database.

## 6. (Optional) Run it like production

```bash
npm run build
npm start
```

That's it — once step 3–4 are done correctly, all four reports (Daily Performance, Room Occupancy, Doctor Performance, Volume Trends) should populate with the sample data. Real data comes later, once your IT team wires up the nightly import described in `README.md`.

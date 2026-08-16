/* =========================================================================
   Creates a dedicated, read-only SQL login/user for the Next.js app.
   Run this ONCE by a DBA against the target SQL Server instance, after
   001_schema.sql has created the AsiriDailyReport database and tables.

   Section 12 of the requirement brief ("Basic security requirements")
   calls for a read-only database account for the application — this is
   that account. Put its password into DB_PASSWORD in .env.local; never
   commit the password to source control.
   ========================================================================= */

USE master;
GO

IF NOT EXISTS (SELECT 1 FROM sys.server_principals WHERE name = 'asiri_report_app')
BEGIN
    CREATE LOGIN asiri_report_app WITH PASSWORD = 'CHANGE_ME_STRONG_PASSWORD!', CHECK_POLICY = ON;
END
GO

USE AsiriDailyReport;
GO

IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'asiri_report_app')
BEGIN
    CREATE USER asiri_report_app FOR LOGIN asiri_report_app;
END
GO

-- Read-only: SELECT only, on this database only. No INSERT/UPDATE/DELETE/DDL.
ALTER ROLE db_datareader ADD MEMBER asiri_report_app;
GO

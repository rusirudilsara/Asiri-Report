/* =========================================================================
   Asiri Daily Reporting System — MVP schema
   Target: Microsoft SQL Server 2019+ / Azure SQL

   Design notes for the company IT team
   -------------------------------------
   - Hospitals is the shared dimension used by every fact table.
   - DailyPerformance is intentionally GENERIC: one row per
     (ReportDate, Hospital, MetricCode). The "Category" column is what
     groups metrics into report sections (Executive Summary, Patient
     Experience, Laboratory Performance, Asiri Heart Centre, ...). The
     web app renders one collapsible section per distinct Category and
     one metric row per MetricCode found for that Category/date/hospital.
     This means the IT team can light up a new report section by simply
     inserting rows with a new Category value — no application code
     change is required. See README.md section "Adding a new Daily
     Performance section" for the exact convention.
   - RoomOccupancy and DoctorPerformance are purpose-built tables that
     mirror the Room Occupancy and Doctor Performance prototypes closely,
     since those reports have a fixed, well-understood shape.
   - Nothing here stores patient-identifiable data (no names, no MRNs).
   ========================================================================= */

IF DB_ID('AsiriDailyReport') IS NULL
BEGIN
    RAISERROR('Run this script against the AsiriDailyReport database (create it first if it does not exist).', 16, 1);
END
GO

/* ---------------------------------------------------------------------
   Hospitals
   --------------------------------------------------------------------- */
IF OBJECT_ID('dbo.Hospitals', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Hospitals (
        HospitalId      INT IDENTITY(1,1)  NOT NULL,
        HospitalCode    VARCHAR(10)        NOT NULL,
        HospitalName    VARCHAR(100)       NOT NULL,
        City            VARCHAR(50)        NULL,
        IsActive        BIT                NOT NULL CONSTRAINT DF_Hospitals_IsActive DEFAULT (1),
        SortOrder       INT                NOT NULL CONSTRAINT DF_Hospitals_SortOrder DEFAULT (0),
        CreatedAt       DATETIME2(0)       NOT NULL CONSTRAINT DF_Hospitals_CreatedAt DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT PK_Hospitals PRIMARY KEY CLUSTERED (HospitalId),
        CONSTRAINT UQ_Hospitals_Code UNIQUE (HospitalCode)
    );
END
GO

/* ---------------------------------------------------------------------
   DailyPerformance — generic KPI fact table driving the Daily
   Performance Report (section 8.1 of the requirement brief).
   --------------------------------------------------------------------- */
IF OBJECT_ID('dbo.DailyPerformance', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.DailyPerformance (
        DailyPerformanceId BIGINT IDENTITY(1,1)   NOT NULL,
        ReportDate          DATE                  NOT NULL,
        HospitalId           INT                  NOT NULL,
        Category             VARCHAR(120)         NOT NULL,   -- report section, e.g. 'Executive Summary'
        MetricCode            VARCHAR(50)         NOT NULL,   -- stable key, e.g. 'EXEC_TOTAL_REVENUE'
        MetricName             VARCHAR(200)       NOT NULL,   -- display label
        Unit                    VARCHAR(20)       NOT NULL CONSTRAINT DF_DailyPerformance_Unit DEFAULT ('count'),
                                                    -- 'count' | 'LKR' | '%' | 'days' | 'min' | 'hrs' | 'kg' | 'ratio'
        ActualValue              DECIMAL(18,4)    NOT NULL CONSTRAINT DF_DailyPerformance_Actual DEFAULT (0), -- "Day" value
        MTDValue                  DECIMAL(18,4)   NULL,       -- month-to-date cumulative (additive) or average (rate)
        TargetValue                DECIMAL(18,4)  NULL,
        BudgetValue                  DECIMAL(18,4) NULL,
        PriorMonthValue                DECIMAL(18,4) NULL,    -- MTD, same period last month ("Cum LM")
        PriorYearValue                    DECIMAL(18,4) NULL,
        LowerIsBetter                       BIT     NOT NULL CONSTRAINT DF_DailyPerformance_LowerBetter DEFAULT (0),
        SortOrder                            INT    NOT NULL CONSTRAINT DF_DailyPerformance_Sort DEFAULT (0),
        UpdatedAt                            DATETIME2(0) NOT NULL CONSTRAINT DF_DailyPerformance_Updated DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT PK_DailyPerformance PRIMARY KEY CLUSTERED (DailyPerformanceId),
        CONSTRAINT UQ_DailyPerformance UNIQUE (ReportDate, HospitalId, MetricCode),
        CONSTRAINT FK_DailyPerformance_Hospital FOREIGN KEY (HospitalId) REFERENCES dbo.Hospitals (HospitalId)
    );
    CREATE INDEX IX_DailyPerformance_Lookup ON dbo.DailyPerformance (HospitalId, ReportDate, Category);
    CREATE INDEX IX_DailyPerformance_Metric ON dbo.DailyPerformance (MetricCode, ReportDate);
END
GO

/* ---------------------------------------------------------------------
   RoomOccupancy — feeds the Room Occupancy Report (section 8.2).
   --------------------------------------------------------------------- */
IF OBJECT_ID('dbo.RoomOccupancy', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.RoomOccupancy (
        RoomOccupancyId    BIGINT IDENTITY(1,1)  NOT NULL,
        ReportDate          DATE                 NOT NULL,
        HospitalId           INT                 NOT NULL,
        RoomCode              VARCHAR(20)        NOT NULL,
        RoomCategory            VARCHAR(150)     NOT NULL,
        TotalBeds                 INT            NOT NULL CONSTRAINT DF_RoomOcc_TotalBeds DEFAULT (0),
        OccupiedBedsDay              INT         NOT NULL CONSTRAINT DF_RoomOcc_OccBedsDay DEFAULT (0),
        OccupiedHoursDay                DECIMAL(10,2) NOT NULL CONSTRAINT DF_RoomOcc_OccHrsDay DEFAULT (0),
        OccupiedHoursMTD                   DECIMAL(12,2) NOT NULL CONSTRAINT DF_RoomOcc_OccHrsMTD DEFAULT (0),
        UpdatedAt                             DATETIME2(0) NOT NULL CONSTRAINT DF_RoomOcc_Updated DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT PK_RoomOccupancy PRIMARY KEY CLUSTERED (RoomOccupancyId),
        CONSTRAINT UQ_RoomOccupancy UNIQUE (ReportDate, HospitalId, RoomCode),
        CONSTRAINT FK_RoomOccupancy_Hospital FOREIGN KEY (HospitalId) REFERENCES dbo.Hospitals (HospitalId)
    );
    CREATE INDEX IX_RoomOccupancy_Lookup ON dbo.RoomOccupancy (HospitalId, ReportDate);
END
GO

/* ---------------------------------------------------------------------
   DoctorPerformance — feeds the Doctor Performance Dashboard (8.3).
   No patient-level data; doctor-level income aggregates only.
   --------------------------------------------------------------------- */
IF OBJECT_ID('dbo.DoctorPerformance', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.DoctorPerformance (
        DoctorPerformanceId BIGINT IDENTITY(1,1) NOT NULL,
        ReportDate            DATE                NOT NULL,
        HospitalId             INT                NOT NULL,
        DoctorCode               VARCHAR(20)      NOT NULL,
        DoctorName                 VARCHAR(150)   NOT NULL,
        Specialty                    VARCHAR(100) NOT NULL,
        InpatientCount                  INT       NOT NULL CONSTRAINT DF_DocPerf_InPatients DEFAULT (0),
        InpatientProfessionalFee           DECIMAL(18,2) NOT NULL CONSTRAINT DF_DocPerf_InPF DEFAULT (0),
        InpatientHospitalIncome               DECIMAL(18,2) NOT NULL CONSTRAINT DF_DocPerf_InIncome DEFAULT (0),
        ChannelingBookingCount                   INT NOT NULL CONSTRAINT DF_DocPerf_ChBookings DEFAULT (0),
        ChannelingProfessionalFee                   DECIMAL(18,2) NOT NULL CONSTRAINT DF_DocPerf_ChPF DEFAULT (0),
        ChannelingHospitalIncome                       DECIMAL(18,2) NOT NULL CONSTRAINT DF_DocPerf_ChIncome DEFAULT (0),
        UpdatedAt                                         DATETIME2(0) NOT NULL CONSTRAINT DF_DocPerf_Updated DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT PK_DoctorPerformance PRIMARY KEY CLUSTERED (DoctorPerformanceId),
        CONSTRAINT UQ_DoctorPerformance UNIQUE (ReportDate, HospitalId, DoctorCode),
        CONSTRAINT FK_DoctorPerformance_Hospital FOREIGN KEY (HospitalId) REFERENCES dbo.Hospitals (HospitalId)
    );
    CREATE INDEX IX_DoctorPerformance_Lookup ON dbo.DoctorPerformance (HospitalId, ReportDate);
    CREATE INDEX IX_DoctorPerformance_Doctor ON dbo.DoctorPerformance (DoctorCode, ReportDate);
END
GO

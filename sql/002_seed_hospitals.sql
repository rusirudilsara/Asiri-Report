/* Auto-generated sample data — safe to re-run (idempotent via NOT EXISTS checks). */

SET NOCOUNT ON;

IF NOT EXISTS (SELECT 1 FROM dbo.Hospitals WHERE HospitalCode = 'ASH')
    INSERT INTO dbo.Hospitals (HospitalCode, HospitalName, City, SortOrder) VALUES ('ASH', 'Asiri Surgical Hospital', 'Colombo', 1);
IF NOT EXISTS (SELECT 1 FROM dbo.Hospitals WHERE HospitalCode = 'ACH')
    INSERT INTO dbo.Hospitals (HospitalCode, HospitalName, City, SortOrder) VALUES ('ACH', 'Asiri Central Hospital', 'Colombo', 2);
IF NOT EXISTS (SELECT 1 FROM dbo.Hospitals WHERE HospitalCode = 'AMH')
    INSERT INTO dbo.Hospitals (HospitalCode, HospitalName, City, SortOrder) VALUES ('AMH', 'Asiri Medical Hospital', 'Colombo', 3);
IF NOT EXISTS (SELECT 1 FROM dbo.Hospitals WHERE HospitalCode = 'AHK')
    INSERT INTO dbo.Hospitals (HospitalCode, HospitalName, City, SortOrder) VALUES ('AHK', 'Asiri Hospital Kandy', 'Kandy', 4);
IF NOT EXISTS (SELECT 1 FROM dbo.Hospitals WHERE HospitalCode = 'AHG')
    INSERT INTO dbo.Hospitals (HospitalCode, HospitalName, City, SortOrder) VALUES ('AHG', 'Asiri Hospital Galle', 'Galle', 5);
IF NOT EXISTS (SELECT 1 FROM dbo.Hospitals WHERE HospitalCode = 'AHM')
    INSERT INTO dbo.Hospitals (HospitalCode, HospitalName, City, SortOrder) VALUES ('AHM', 'Asiri Hospital Matara', 'Matara', 6);

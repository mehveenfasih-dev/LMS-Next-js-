USE [library_lms];
GO

IF COL_LENGTH('dbo.Books', 'publisher') IS NULL
BEGIN
    ALTER TABLE dbo.Books
      ADD publisher VARCHAR(150) NOT NULL
        CONSTRAINT DF_Books_publisher DEFAULT ('');
END;
GO

IF COL_LENGTH('dbo.Books', 'pages') IS NULL
BEGIN
    ALTER TABLE dbo.Books
      ADD pages INT NOT NULL
        CONSTRAINT DF_Books_pages DEFAULT (1);
END;
GO

IF COL_LENGTH('dbo.Books', 'description') IS NULL
BEGIN
    ALTER TABLE dbo.Books
      ADD description VARCHAR(MAX) NOT NULL
        CONSTRAINT DF_Books_description DEFAULT ('');
END;
GO

CREATE OR ALTER TRIGGER dbo.trg_Books_Audit
ON dbo.Books
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO dbo.BookAudit (bookID, actionName, actionTime)
    SELECT
        COALESCE(i.bookID, d.bookID),
        CASE
            WHEN i.bookID IS NOT NULL AND d.bookID IS NOT NULL THEN 'UPDATE'
            WHEN i.bookID IS NOT NULL THEN 'INSERT'
            ELSE 'DELETE'
        END,
        GETDATE()
    FROM inserted AS i
    FULL OUTER JOIN deleted AS d ON d.bookID = i.bookID;
END;
GO

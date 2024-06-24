-- creating previous tables before v9

CREATE TABLE IF NOT EXISTS ExportBase(
    ticketID char(36) PRIMARY KEY,
    maxTestRuns integer NOT NULL DEFAULT 10
);

-- reverting version
UPDATE configbase SET value = 8 WHERE key = 'VERSION';


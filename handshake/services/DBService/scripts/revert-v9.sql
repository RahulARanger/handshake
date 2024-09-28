alter table runbase drop column status;

-- making the started column in the suitebase mandate
alter table suitebase add column started_2 timestamp not null;
update suitebase set started_2 = started;
alter table suitebase drop column started;
alter table suitebase rename column started_2 to started;

-- creating previous tables before v9

CREATE TABLE IF NOT EXISTS ExportBase(
    ticketID char(36) PRIMARY KEY,
    maxTestRuns integer NOT NULL DEFAULT 10
);

-- reverting version
UPDATE ConfigBase SET value = 8 WHERE key = 'VERSION';

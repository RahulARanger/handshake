alter table runbase add column status NOT NULL DEFAULT "COMPLETED";

-- making the started column in the suitebase optional at the beginning
alter table suitebase add column started_2 timestamp;
update suitebase set started_2 = started;
alter table suitebase drop column started;
alter table suitebase rename column started_2 to started;

-- dropping unused tables
drop table if exists ExportBase;
drop table if exists PrunedBase;


-- Version Migration
UPDATE ConfigBase SET value = 9 WHERE key = 'VERSION';

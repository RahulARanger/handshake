alter table runbase add column status NOT NULL DEFAULT "COMPLETED";

-- dropping unused tables
drop table if exists ExportBase;
drop table if exists PrunedBase;


-- Version Migration
UPDATE ConfigBase SET value = 9 WHERE key = 'VERSION';

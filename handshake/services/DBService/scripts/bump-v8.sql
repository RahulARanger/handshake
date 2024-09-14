alter table runbase add column status NOT NULL DEFAULT "COMPLETED"

-- Version Migration
UPDATE ConfigBase SET value = 9 WHERE key = 'VERSION';

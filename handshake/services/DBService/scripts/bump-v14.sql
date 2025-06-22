alter table runbase add column projectDescription TEXT DEFAULT NULL;

-- Version Migration
UPDATE ConfigBase SET value = 15 WHERE key = 'VERSION';
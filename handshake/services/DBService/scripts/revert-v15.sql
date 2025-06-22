alter table runbase drop column projectDescription;

-- Version Migration
UPDATE ConfigBase SET value = 14 WHERE key = 'VERSION';

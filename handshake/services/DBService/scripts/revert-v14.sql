alter table suitebase drop column expected;

-- Version Migration
UPDATE ConfigBase SET value = 13 WHERE key = 'VERSION';
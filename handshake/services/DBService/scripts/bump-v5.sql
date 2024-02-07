-- from now on we won't be deleting the processed tasks before deleting the test runs

alter table taskbase add column processed int default 0;

-- Version Migration
UPDATE ConfigBase SET value = 6 WHERE key = 'VERSION';

alter table suitebase add column expected varchar(11) DEFAULT 'PASSED';

-- Version Migration
UPDATE ConfigBase SET value = 14 WHERE key = 'VERSION';

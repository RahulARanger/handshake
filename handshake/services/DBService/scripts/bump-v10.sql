alter table suitebase add column retried_later int default 0;
alter table sessionbase drop column retried;

-- Version Migration
UPDATE ConfigBase SET value = 11 WHERE key = 'VERSION';

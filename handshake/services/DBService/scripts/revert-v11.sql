alter table suitebase drop column retried_later;
alter table sessionbase add column retried int default 0;

-- reverting version
UPDATE ConfigBase SET value = 10 WHERE key = 'VERSION';

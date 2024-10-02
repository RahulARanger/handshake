alter table suitebase drop column setup_duration;
alter table suitebase drop column teardown_duration;

-- reverting version
UPDATE ConfigBase SET value = 9 WHERE key = 'VERSION';

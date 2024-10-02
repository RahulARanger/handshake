-- adding two new cols which will have setup and teardown duration
alter table suitebase add column setup_duration real default 0;
alter table suitebase add column teardown_duration real default 0;

-- Version Migration
UPDATE ConfigBase SET value = 10 WHERE key = 'VERSION';

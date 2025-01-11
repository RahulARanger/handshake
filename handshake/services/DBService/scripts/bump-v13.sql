alter table suitebase add column xfailed int not null default 0;
alter table suitebase add column xpassed int not null default 0;
alter table rollupbase add column xfailed int not null default 0;
alter table rollupbase add column xpassed int not null default 0;
alter table runbase add column xfailed int not null default 0;
alter table runbase add column xpassed int not null default 0;
alter table sessionbase add column xfailed int not null default 0;
alter table sessionbase add column xpassed int not null default 0;
alter table runbase add column xfailedSuites int not null default 0;
alter table runbase add column xpassedSuites int not null default 0;

-- Version Migration
UPDATE ConfigBase SET value = 14 WHERE key = 'VERSION';

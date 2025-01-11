alter table suitebase drop column xfailed;
alter table suitebase drop column xpassed;
alter table rollupbase drop column xfailed;
alter table rollupbase drop column xpassed;
alter table runbase drop column xfailed;
alter table runbase drop column xpassed;
alter table runbase drop column xfailedSuites;
alter table runbase drop column xpassedSuites;
alter table sessionbase drop column xfailed;
alter table sessionbase drop column xpassed;

-- Version Migration
UPDATE ConfigBase SET value = 13 WHERE key = 'VERSION';

alter table runbase add column suiteSummary json not null default '{}';
update runbase set suiteSummary = json(json_object('count', suites, 'passed', passedSuites, 'skipped', skippedSuites, 'failed', failedSuites));

alter table runbase drop column passedSuites;
alter table runbase drop column failedSuites;
alter table runbase drop column skippedSuites;
alter table runbase drop column suites;

-- Version Migration
UPDATE ConfigBase SET value = 12 WHERE key = 'VERSION';
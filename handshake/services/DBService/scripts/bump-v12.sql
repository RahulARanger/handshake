alter table runbase add column passedSuites INT NOT NULL DEFAULT 0;
alter table runbase add column failedSuites INT NOT NULL DEFAULT 0;
alter table runbase add column skippedSuites INT NOT NULL DEFAULT 0;
alter table runbase add column suites INT NOT NULL DEFAULT 0;

update runbase set skippedSuites = suiteSummary -> 'skipped';
update runbase set failedSuites = suiteSummary -> 'failed';
update runbase set passedSuites = suiteSummary -> 'passed';
update runbase set suites = suiteSummary -> 'count';

alter table runbase drop column suiteSummary;

-- Version Migration
UPDATE ConfigBase SET value = 13 WHERE key = 'VERSION';

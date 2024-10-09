alter table suitebase drop column setup_duration;
alter table suitebase drop column teardown_duration;

alter table attachmentbase drop column title;
alter table attachmentbase drop column value;
alter table attachmentbase drop column extraValues;
alter table attachmentbase drop column tags;
alter table attachmentbase add column attachmentValue json default '{}';

alter table staticbase drop column title;
alter table staticbase drop column value;
alter table staticbase drop column extraValues;
alter table staticbase drop column tags;
alter table staticbase add column attachmentValue json default '{}';

-- reverting version
UPDATE ConfigBase SET value = 9 WHERE key = 'VERSION';
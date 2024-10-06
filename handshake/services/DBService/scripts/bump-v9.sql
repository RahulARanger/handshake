-- adding two new cols which will have setup and teardown duration
alter table suitebase add column setup_duration real default 0;
alter table suitebase add column teardown_duration real default 0;

alter table attachmentbase add column title VARCHAR(200) NOT NULL DEFAULT '';
alter table attachmentbase add column value text not null default '';
alter table attachmentbase add column extraValues json not null default '{}';
alter table attachmentbase drop column attachmentValue;
alter table attachmentbase add column tags json default '[]';

alter table staticbase add column title VARCHAR(200) NOT NULL DEFAULT '';
alter table staticbase add column value text not null default '';
alter table staticbase add column extraValues json not null default '{}';
alter table staticbase drop column attachmentValue;
alter table staticbase add column tags json default '[]';



-- Version Migration
UPDATE ConfigBase SET value = 10 WHERE key = 'VERSION';

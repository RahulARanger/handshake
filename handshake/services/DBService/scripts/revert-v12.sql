alter table testlogbase add column feed json default '{}';
alter table testlogbase drop column apiGenerated;
alter table testlogbase drop column schedulerGenerated;
alter table testlogbase drop column userGenerated;
alter table testlogbase drop column generatedBy;
alter table testlogbase drop column tags;

-- Version Migration
UPDATE ConfigBase SET value = 11 WHERE key = 'VERSION';

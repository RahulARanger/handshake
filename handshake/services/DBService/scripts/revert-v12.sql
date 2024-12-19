alter table testlogbase drop column generatedByGroup;
alter table testlogbase drop column generatedBy;
alter table testlogbase drop column tags;

-- Version Migration
UPDATE ConfigBase SET value = 11 WHERE key = 'VERSION';

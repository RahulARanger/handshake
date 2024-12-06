alter table testlogbase drop column feed;
alter table testlogbase add column apiGenerated BOOLEAN DEFAULT FALSE;
alter table testlogbase add column schedulerGenerated BOOLEAN DEFAULT FALSE;
alter table testlogbase add column userGenerated BOOLEAN DEFAULT FALSE;
alter table testlogbase add column generatedBy VARCHAR(200) DEFAULT '';
alter table testlogbase add column tags JSON DEFAULT '[]';

-- Version Migration
UPDATE ConfigBase SET value = 12 WHERE key = 'VERSION';

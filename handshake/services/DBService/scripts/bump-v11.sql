alter table testlogbase add column generatedByGroup INTEGER DEFAULT 0;
alter table testlogbase add column generatedBy VARCHAR(80) DEFAULT '';
alter table testlogbase add column tags JSON DEFAULT '[]';

-- Version Migration
UPDATE ConfigBase SET value = 12 WHERE key = 'VERSION';

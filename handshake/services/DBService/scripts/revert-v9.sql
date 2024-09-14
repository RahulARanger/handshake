alter table runbase drop column status;

-- reverting version
UPDATE ConfigBase SET value = 8 WHERE key = 'VERSION';

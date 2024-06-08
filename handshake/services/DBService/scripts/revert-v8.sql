alter table configbase drop column readonly;

-- reverting version
UPDATE configbase SET value = 7 WHERE key = 'VERSION';
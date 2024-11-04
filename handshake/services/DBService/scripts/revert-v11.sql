INSERT OR IGNORE INTO CONFIGBASE(Key, value) VALUES ('RESET_FIX_TEST_RUN', '');
UPDATE CONFIGBASE SET value = '' where key = 'RESET_FIX_TEST_RUN';

alter table suitebase drop column case_index;

-- reverting version
UPDATE ConfigBase SET value = 10 WHERE key = 'VERSION';
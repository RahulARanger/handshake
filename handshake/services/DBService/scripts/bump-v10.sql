INSERT OR IGNORE INTO CONFIGBASE(Key, value) VALUES ('RESET_FIX_TEST_RUN', 1);
UPDATE CONFIGBASE SET value = 1 where key = 'RESET_FIX_TEST_RUN';

alter table suitebase add column case_index varchar(12) default '';


-- Version Migration
UPDATE ConfigBase SET value = 11 WHERE key = 'VERSION';
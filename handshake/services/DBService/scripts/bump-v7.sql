alter table configbase add column readonly int DEFAULT 1;

-- inserting values
INSERT OR IGNORE INTO configbase("key", "value", "readonly") VALUES('MAX_RUNS_PER_PROJECT', '100', '0');
INSERT OR IGNORE INTO configbase("key", "value", "readonly") VALUES('RESET_FIX_TEST_RUN', '', '1');
INSERT OR IGNORE INTO configbase("key", "value", "readonly") VALUES('VERSION', '8', '1');
INSERT OR IGNORE INTO configbase("key", "value", "readonly") VALUES('RECENTLY_DELETED', '0', '1');

-- updating values
UPDATE configbase set readonly = 0 where key = 'MAX_RUNS_PER_PROJECT';
UPDATE configbase set readonly = 1 where key = 'RESET_FIX_TEST_RUN';
UPDATE configbase set readonly = 1 where key = 'VERSION';
UPDATE configbase set readonly = 1 where key = 'RECENTLY_DELETED';


-- Version Migration
UPDATE ConfigBase SET value = 8 WHERE key = 'VERSION';

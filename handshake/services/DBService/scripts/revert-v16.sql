delete from configbase where key = 'RESET_FIX_TEST_RUN';

-- Version Migration
UPDATE ConfigBase SET value = 15 WHERE key = 'VERSION';

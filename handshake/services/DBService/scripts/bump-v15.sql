alter table runbase add column tags JSON NOT NULL DEFAULT '[]';
UPDATE runbase
SET tags = (
  SELECT tc.tags
  FROM testconfigbase tc
  WHERE tc.test_id = runbase.testID
  LIMIT 1
);

alter table testconfigbase drop column tags;

-- Version Migration
UPDATE ConfigBase SET value = 16 WHERE key = 'VERSION';
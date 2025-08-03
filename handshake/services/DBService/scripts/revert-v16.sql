ALTER TABLE testconfigbase ADD COLUMN tags JSON NOT NULL DEFAULT '[]';
UPDATE testconfigbase
SET tags = (
  SELECT r.tags
  FROM runbase r
  WHERE r.testID = testconfigbase.test_id
  LIMIT 1
);
Alter table runbase drop column tags;

-- Version Migration
UPDATE ConfigBase SET value = 15 WHERE key = 'VERSION';

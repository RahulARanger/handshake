-- Revert #1: Records converted to assertbase, bringing it back to attachmentbase
INSERT INTO attachmentbase (entity_id, type, description, attachmentValue)
SELECT
    entity_id,
    'ASSERT' AS type,
    '' AS description,
    json(json_object(
        'color', '',
        'value', '{"matcherName":"' || title || '","options":' || json_object('wait', wait, 'interval', interval) || ',"result":' || json_object('pass', passed) || '}',
        'title', title
    )) AS attachmentValue
FROM assertbase;

DROP TABLE assertbase;

-- Revert #2: Clarity column
ALTER TABLE exportbase DROP COLUMN clarity;

-- Revert #3: Testconfigbase structure
CREATE TEMP TABLE runconfigbase AS SELECT * FROM testconfigbase;
DROP TABLE testconfigbase;

CREATE TABLE testconfigbase (
    id INTEGER PRIMARY KEY,
    test_id VARCHAR(36) NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    attachmentValue TEXT NOT NULL DEFAULT '{}',
    type TEXT NOT NULL DEFAULT 'CONFIG',
    FOREIGN KEY (test_id) REFERENCES runbase(testID) ON DELETE CASCADE
);

INSERT INTO testconfigbase (test_id, attachmentValue, type)
SELECT
    test_id,
    json_object(
        'platformName', platform, 'maxInstances', maxInstances, 'framework', framework,
        'fileRetries', fileRetries,
        'exitCode', exitCode,
        'avoidParentSuitesInCount', avoidParentSuitesInCount,
        'saveOptions', json_object('bail', bail)
    ),
    'CONFIG'
FROM runconfigbase;

-- Revert #4: Version
UPDATE ConfigBase SET value = 4 WHERE key = 'VERSION';

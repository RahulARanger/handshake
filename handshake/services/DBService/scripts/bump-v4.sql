-- Migration #1: Create a separate table for assertions instead of storing it in the attachment base
CREATE TABLE assertbase (
    id INTEGER PRIMARY KEY,
    entity_id VARCHAR(36) NOT NULL,
    title TEXT NOT NULL,
    passed INTEGER NOT NULL,
    wait INTEGER NULL,
    message TEXT NULL,
    interval INTEGER NULL,
    FOREIGN KEY (entity_id) REFERENCES suitebase(suiteID) ON DELETE CASCADE
);

INSERT INTO assertbase(entity_id, title, passed, wait, interval)
SELECT
    entity_id,
    CAST(attachmentValue ->> '$.title' AS TEXT) AS title,
    CAST(attachmentValue ->> '$.value' ->> '$.result.pass' AS INTEGER) AS passed,
    CAST(attachmentValue ->> '$.value' ->> '$.options.wait' AS INTEGER) AS wait,
    CAST(attachmentValue ->> '$.value' ->> '$.options.interval' AS INTEGER) AS interval
FROM attachmentbase
WHERE type = 'ASSERT';

DELETE FROM attachmentbase WHERE type = 'ASSERT';


-- Migration #2: Add Column for clarity code
ALTER TABLE exportbase ADD COLUMN clarity VARCHAR(30) NULL;

-- Migration #3: Altering the structure of the TestConfigBase
CREATE TEMP TABLE runconfigbase AS
SELECT
    test_id,
    attachmentValue ->> '$.platformName' AS platform,
    attachmentValue ->> '$.framework' AS framework,
    attachmentValue ->> '$.maxInstances' AS maxInstances,
    attachmentValue ->> '$.exitCode' AS exitCode,
    attachmentValue ->> '$.fileRetries' AS fileRetries,
    attachmentValue ->> '$.avoidParentSuitesInCount' AS avoidParentSuitesInCount,
    attachmentValue ->> '$.saveOptions.bail' AS bail
FROM testconfigbase
WHERE type = 'CONFIG';

DROP TABLE testconfigbase;

CREATE TABLE testconfigbase (
    test_id VARCHAR(36) PRIMARY KEY,
    platform TEXT NOT NULL,
    framework TEXT NOT NULL,
    maxInstances INTEGER NOT NULL,
    exitCode INTEGER NOT NULL,
    fileRetries INTEGER NOT NULL,
    avoidParentSuitesInCount INTEGER NOT NULL,
    bail INTEGER NOT NULL,
    FOREIGN KEY (test_id) REFERENCES runbase(testID) ON DELETE CASCADE
);

INSERT INTO testconfigbase (
    test_id, platform, framework, maxInstances, exitCode, fileRetries, avoidParentSuitesInCount, bail
)
SELECT * FROM runconfigbase;


-- Version Migration
UPDATE ConfigBase SET value = 5 WHERE key = 'VERSION';

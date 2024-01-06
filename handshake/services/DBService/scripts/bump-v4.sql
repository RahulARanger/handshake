-- Migration #1: Create separate table for the assertions instead of storing it in the attachment base
CREATE TABLE assertbase (
    id INTEGER PRIMARY KEY,
    entity_id VARCHAR(36) NOT NULL,
    title TEXT NOT NULL,
    passed INTEGER NOT NULL,
    wait INTEGER NULL,
    message TEXT NULL,
    interval INTEGER NULL,
    FOREIGN KEY (entity_id) REFERENCES suitebase(suiteID)
    ON DELETE CASCADE
);

insert into assertbase(entity_id, title, passed, wait, interval)
select
entity_id,
cast(attachmentValue ->> '$.title' as TEXT) as title,
cast(attachmentValue ->> '$.value' ->> '$.result.pass' as INTEGER) as passed,
cast(attachmentValue ->> '$.value' ->> '$.options.wait' as INTEGER) as wait,
cast(attachmentValue ->> '$.value' ->> '$.options.interval' as INTEGER) as interval
from attachmentbase where type = 'ASSERT';

delete from attachmentbase where type = 'ASSERT';


-- Migration #2: Add Column for clarity code
alter table exportbase add column clarity varchar(30) NULL;

-- Version Migration
update ConfigBase set value = 5 where key = 'VERSION';
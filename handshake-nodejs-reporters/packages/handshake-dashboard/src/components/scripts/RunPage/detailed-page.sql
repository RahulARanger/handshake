-- save the test run id
CREATE TEMP TABLE CURRENT_RUN_ID AS SELECT testID from runbase where testID = '?' AND ended <> '';

-- fetch the details of the requested test run
CREATE TEMP TABLE CURRENT_RUN AS
 SELECT *, suiteSummary -> '$.count' as suites,
  suiteSummary -> '$.passed' as passedSuites,
   suiteSummary -> '$.skipped' as skippedSuites
  FROM runbase where testID in CURRENT_RUN_ID;
  
  -- and the config associated with this test run
CREATE TEMP TABLE TEST_CONFIG AS SELECT * from testconfigbase where test_id in CURRENT_RUN_ID;


create temp table CURRENT_SESSIONS as select sessionID from sessionbase where test_id in CURRENT_RUN_ID;
create temp table CURRENT_SESSION_RECORDS as select * from sessionbase where sessionID in CURRENT_SESSIONS;
create temp table CURRENT_ENTITIES as select suiteID from suitebase where session_id in CURRENT_SESSIONS;

-- extract the required details for suites
create temp table SUITES as
  select
    suitebase.*,
    json_array_length(errors) as numberOfErrors,
    errors ->> '[0]' as error,
    entityName, entityVersion, simplified, hooks,
    rollupbase.passed as rollup_passed, rollupbase.failed as rollup_failed, rollupbase.skipped as rollup_skipped,
    rollupbase.tests as rollup_tests
  from suitebase
      join CURRENT_SESSION_RECORDS 
      on CURRENT_SESSION_RECORDS.sessionID = suitebase.session_id and suitebase.suiteType = 'SUITE'
      join rollupbase
      on suitebase.suiteID = rollupbase.suite_id;
      
-- extract all the assertions
create temp table ASSERTIONS as select * from assertbase where entity_id in CURRENT_ENTITIES;

-- listing all images
create temp table IMAGES AS 
select 
	attachmentValue ->> '$.value' as path,
	attachmentValue ->> '$.title' as title,
  description,
  entity_id
from staticbase where entity_id in CURRENT_ENTITIES;


-- required for identifying the broken tests
CREATE temp table PROPERLY_FAILED as select distinct entity_id from ASSERTIONS where passed = 0;

-- listing all test entities
create temp table TESTS as
select suitebase.*, 
		json_array_length(errors) as numberOfErrors,
  	errors ->> '[0]' as error,
    (PROPERLY_FAILED.entity_id is NULL and standing in ('FAILED', 'RETRIED')) as broken
	from suitebase 
	left join PROPERLY_FAILED
	on PROPERLY_FAILED.entity_id = suitebase.suiteID
  where suitebase.suiteType = 'TEST' and suitebase.session_id in CURRENT_SESSIONS;
  
-- other attachments
create temp table LINKS as 
select 
	entity_id, 
	attachmentValue ->> '$.value' as url,
	attachmentValue ->> '$.title' as title 
from attachmentbase where type = 'LINK' and entity_id in CURRENT_ENTITIES;

create temp table DESCRIPTIONS as 
select 
  entity_id,
  attachmentValue ->> '$.value' as description 
from attachmentbase where type = 'DESC' and entity_id in CURRENT_ENTITIES;


-- identifying and listing all the required retried suites
CREATE TEMP TABLE RETRIES AS 
	select value as test, tests, length, suite_id from 
  	retriedbase join json_each(tests) where suite_id in CURRENT_ENTITIES;
 
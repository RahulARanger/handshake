-- save the test run id
CREATE TEMP TABLE CURRENT_RUN_ID AS SELECT testID from runbase where testID = '?' AND ended <> '';
-- and the config associated with this test run
CREATE TEMP TABLE TEST_CONFIG AS SELECT * from testconfigbase where test_id in CURRENT_RUN_ID;

-- fetches all the sessions under the test run
CREATE TEMP TABLE CURRENT_SESSIONS AS SELECT sessionID FROM SESSIONBASE where test_id in CURRENT_RUN_ID;
-- saves their summary
CREATE TEMP TABLE SESSION_SUMMARY AS select entityName, entityVersion, sum(tests) as tests from sessionbase where sessionID in CURRENT_SESSIONS group by entityName, entityVersion;
-- stores the ids of all test entities
CREATE TEMP TABLE CURRENT_SUITES AS SELECT suiteID from suiteBase where session_id in CURRENT_SESSIONS;

-- this for storing aggregate values
CREATE TEMP TABLE KEY_NUMBERS(
  key TEXT PRIMARY KEY,
  value INTEGER NOT NULL
);

-- stores the recent suites and tests {recent 6 in each}
CREATE TEMP TABLE RECENT_SUITES AS
    select
        json_array_length(errors) as numberOfErrors,
        * from suitebase
    WHERE session_id in CURRENT_SESSIONS
     and suiteType = 'SUITE'
    --  and standing <> 'RETRIED'
    order by started desc
    limit 6;


CREATE TEMP TABLE RECENT_TESTS AS
select * from (
                  select suitebase.*,
                         count(assertbase.entity_id) as numberOfAssertions from suitebase
                  join assertbase on suitebase.suiteID = assertbase.entity_id
                  WHERE session_id in CURRENT_SESSIONS
                    and suiteType = 'TEST'
                  group by assertbase.entity_id
              )
order by started desc limit 6;



-- stores some info of random 15 images
CREATE TEMP TABLE IMAGES AS 
SELECT attachmentValue ->> '$.value' as path, attachmentValue ->> '$.title' as title from staticbase 
where type = 'PNG' and entity_id in CURRENT_SUITES ORDER BY RANDOM() LIMIT 15;

-- number of parent suites
INSERT INTO KEY_NUMBERS
	select 'parentSuites' as key, count(*) as value from suitebase where parent = '' and standing <> 'RETRIED' 
  and session_id in CURRENT_SESSIONS;

-- number of spec files    
INSERT INTO KEY_NUMBERS 
	SELECT 'files' as key,
	COUNT(DISTINCT file) as value FROM suitebase
  WHERE session_id in CURRENT_SESSIONS; 

-- number of sessions
INSERT INTO KEY_NUMBERS 
	select 'sessionCount' as key,
  count(*) from CURRENT_SESSIONS;

-- Total number of images saved
INSERT INTO KEY_NUMBERS
	select 'imageCount' as key, 
  count(*) from staticbase where type = 'PNG' and entity_id in CURRENT_SUITES;

-- we collect tests which have failed
create temp table LOOK_FOR_TESTS as
	select suiteID from suitebase where suiteID in CURRENT_SUITES and suiteType = 'TEST' and standing = 'FAILED';


-- Number of Broken Tests
INSERT INTO KEY_NUMBERS
	select 'brokenTests' as key, 
  count(*) as broken from LOOK_FOR_TESTS where suiteID not in
	  (select distinct entity_id from assertbase where passed = 0 and entity_id in LOOK_FOR_TESTS);

-- number of sessions
INSERT INTO KEY_NUMBERS 
	select 'isRecent' as key,
  (select testID from CURRENT_RUN_ID) in (select testID from runbase where ended <> '' order by ended desc limit 1);


-- fetch the details of the requested test run
CREATE TEMP TABLE CURRENT_RUN AS
 SELECT *, suiteSummary -> '$.count' as suites,
  suiteSummary -> '$.passed' as passedSuites,
   suiteSummary -> '$.skipped' as skippedSuites
  FROM runbase where testID in CURRENT_RUN_ID;


CREATE TEMP TABLE RELATED_RUNS AS 
  select * from runbase
  where projectName in (
    select projectName from runbase where testID in CURRENT_RUN_ID
  ) and ended <> '';
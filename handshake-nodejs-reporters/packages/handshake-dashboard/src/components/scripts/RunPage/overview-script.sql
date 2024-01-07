-- save the test run id
CREATE TEMP TABLE CURRENT_RUN_ID AS SELECT testID from runbase where testID = "?" AND ended <> '';
-- and the config associated with this test run
CREATE TEMP TABLE TEST_CONFIG AS SELECT * from testconfigbase where test_id in CURRENT_RUN_ID;

-- fetches all the sessions under the test run
CREATE TEMP TABLE CURRENT_SESSIONS AS SELECT sessionID FROM SESSIONBASE;
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
CREATE TEMP TABLE RECENT_ENTITIES AS 
  select * from (
      SELECT
        ROW_NUMBER() OVER (PARTITION BY suiteType ORDER BY started DESC) AS "rank",
      	*
    FROM suiteBase WHERE session_id in CURRENT_SESSIONS
  ) where rank <= 6;
  
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
	COUNT(DISTINCT json_each.value) as value FROM sessionbase JOIN json_each(specs) ON 1=1
  WHERE sessionID in CURRENT_SESSIONS; 

-- number of sessions
INSERT INTO KEY_NUMBERS 
	select 'sessionCount' as key,
  count(*) from CURRENT_SESSIONS;

-- Total number of images saved
INSERT INTO KEY_NUMBERS
	select 'imageCount' as key, 
  count(*) from staticbase where type = 'PNG' and entity_id in CURRENT_SUITES;

create temp table LOOK_FOR_TESTS as
	select suiteID from suitebase where suiteType = 'TEST' and standing in ('RETRIED', 'FAILED');


-- Number of Broken Tests
INSERT INTO KEY_NUMBERS
	select 'brokenTests' as key, 
  count(*) as broken from LOOK_FOR_TESTS where suiteID not in
	  (select distinct entity_id from assertbase where passed = 0 and entity_id in LOOK_FOR_TESTS);


-- fetch the details of the requested test run
CREATE TEMP TABLE CURRENT_RUN AS
 SELECT *, suiteSummary -> '$.count' as suites,
  suiteSummary -> '$.passed' as passedSuites,
   suiteSummary -> '$.skipped' as skippedSuites
  FROM runbase where testID in CURRENT_RUN_ID;

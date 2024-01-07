-- save the test run id
CREATE TEMP TABLE CURRENT_RUN_ID AS SELECT testID from runbase where testID = "?" AND ended <> '';
-- and the config associated with this test run
CREATE TEMP TABLE TEST_CONFIG AS SELECT * from testconfigbase where test_id in CURRENT_RUN_ID;


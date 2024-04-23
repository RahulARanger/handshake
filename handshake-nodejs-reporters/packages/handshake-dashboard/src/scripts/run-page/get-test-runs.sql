-- gets the test ID based on the max runs requested
select testID from RUNBASE WHERE ended <> '' limit ?; 

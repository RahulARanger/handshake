select rb.*, cb.framework from RUNBASE rb
left join testconfigbase cb on rb.testID = cb.test_id 
WHERE rb.ended <> '' order by rb.started desc limit ?;

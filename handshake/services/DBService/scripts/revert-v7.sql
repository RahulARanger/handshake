delete from configbase where key = 'RESET_FIX_TEST_RUN';

alter table SessionBase add standing varchar(11);
update SessionBase set standing = 'PENDING';

alter table SessionBase add specs json;
update SessionBase set specs = (select json_array(file) from suitebase where session_id = sessionID);
alter table ExportBase add column clarity varchar(30);

alter table testlogbase drop column dropped;

UPDATE ConfigBase SET value = 6 WHERE key = 'VERSION';
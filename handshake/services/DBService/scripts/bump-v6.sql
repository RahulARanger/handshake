INSERT INTO CONFIGBASE VALUES ('RESET_FIX_TEST_RUN', 1);

alter table SessionBase drop column standing;
alter table SessionBase drop column specs;
alter table ExportBase drop column clarity;

alter table testlogbase add column dropped timestamp;
update testlogbase set dropped = datetime();


-- Version Migration
UPDATE ConfigBase SET value = 7 WHERE key = 'VERSION';

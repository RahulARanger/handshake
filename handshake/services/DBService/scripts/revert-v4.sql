create temp table temp_view as select entityName from SessionBase;

alter table SessionBase drop entityName;
alter table SessionBase add entityName varchar(10);

update SessionBase set entityName = (select entityName from temp_view);

update ConfigBase set value = 3 where key = 'VERSION';

drop table temp_view;

-- REVERT: limit back to 10 for entityName of session
-- REFERENCE SCRIPT IF IN CASE required
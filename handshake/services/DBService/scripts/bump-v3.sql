create temp table temp_view as select entityName from SessionBase;
--select * from temp_view;
alter table SessionBase drop entityName;
alter table SessionBase add entityName varchar(30);

update SessionBase set entityName = (select entityName from temp_view);

update ConfigBase set value = 4 where key = 'VERSION';
drop table temp_view;

-- https://stackoverflow.com/a/77633836/12318454

-- ISSUE: there was a entityName: "chrome-shell-headless" >10
alter table taskbase drop column processed;

update ConfigBase set value = 5 where key = 'VERSION';
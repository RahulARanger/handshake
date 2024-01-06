    -- revert: records converted to assertbase, bringing it back to attachmentbase

    insert into attachmentbase(entity_id, type, description, attachmentValue)
    select
    entity_id,
    'ASSERT' as type,
    '' as description,
    json(json_object(
        'color', '',
        'value', '{"matcherName":"' || title || '","options":' || json_object('wait', wait, 'interval', interval) || ',"result":' || json_object('pass', passed) || '}',
        'title', title
        )) AS attachmentValue
    from assertbase;

    drop table assertbase;

    -- revert: clarity col
    alter table exportbase drop column clarity;

    -- revert version
    update ConfigBase set value = 4 where key = 'VERSION';
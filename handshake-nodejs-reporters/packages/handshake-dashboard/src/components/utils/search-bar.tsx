import Search from 'antd/lib/input/Search';
import Button from 'antd/lib/button/button';
import type { ReactNode, Ref } from 'react';
import React from 'react';
import type { InputRef } from 'antd/lib';
import TextShadow from '@/styles/text-shadow.module.css';
import type { ChangeEvent, KeyboardEvent, MouseEvent } from 'react';

export default function SearchEntities(properties: {
    value: string;
    reference: Ref<InputRef>;
    onClear: () => void;
    onEscape: () => void;
    placeholder: string;
    onChange: (_: string) => void;
    onSearch: (_: string, hide: boolean) => void;
}): ReactNode {
    return (
        <Search
            placeholder={properties.placeholder}
            value={properties.value}
            ref={properties.reference}
            allowClear
            styles={{
                affixWrapper: {
                    backgroundColor: 'transparent',
                },
            }}
            className={TextShadow.insetShadow}
            addonAfter={
                <Button type="text" size="small" onClick={properties.onClear}>
                    Clear
                </Button>
            }
            onKeyDown={(event_: KeyboardEvent<HTMLInputElement>) => {
                if (event_.key === 'Escape') properties.onEscape();
            }}
            onChange={(event_: ChangeEvent<HTMLInputElement>) =>
                properties.onChange(event_.target.value)
            }
            onSearch={(
                value,
                event:
                    | KeyboardEvent<HTMLInputElement>
                    | ChangeEvent<HTMLInputElement>
                    | MouseEvent<HTMLElement>
                    | undefined,
            ) => {
                properties.onSearch(
                    value?.trim()?.toLowerCase() ?? '',
                    event?.type === 'keydown',
                );
            }}
        />
    );
}

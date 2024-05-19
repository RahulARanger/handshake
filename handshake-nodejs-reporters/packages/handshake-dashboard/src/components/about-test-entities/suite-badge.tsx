import React from 'react';
import { Badge, Group } from '@mantine/core';
import type { ReactNode } from 'react';
import type { ParsedSuiteRecord } from 'types/parsed-records';

export function numberToOrdinal(num: number) {
    const note = {
        zero: '',
        one: 'st',
        two: 'nd',
        few: 'rd',
        other: 'th',
        many: 'th',
    };
    return (
        num + note[new Intl.PluralRules('en', { type: 'ordinal' }).select(num)]
    );
}

export function SuiteBadges(properties: {
    record: ParsedSuiteRecord;
    retriedIndex?: number;
}): ReactNode {
    const badges: ReactNode[] = [];

    if (properties.record.Status === 'RETRIED') {
        badges.push(
            <Badge color="orange" variant="light" key="retried" tt="none">
                {`${numberToOrdinal(properties.retriedIndex ?? 1)} Retry`}
            </Badge>,
        );
    }

    if (properties.record.Parent) {
        badges.push(
            <Badge color="cyan" variant="light" key="retried">
                Child Suite
            </Badge>,
        );
    } else {
        badges.push(
            <Badge color="blue" variant="light" key="retried">
                Parent Suite
            </Badge>,
        );
    }

    return (
        <Group wrap="nowrap" gap={5}>
            {badges}
        </Group>
    );
}

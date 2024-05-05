import { Badge, Group, Tooltip } from '@mantine/core';
import {
    IconBounceRight,
    IconCheck,
    IconRefresh,
    IconWalk,
    IconX,
} from '@tabler/icons-react';
import type { ReactNode } from 'react';
import React from 'react';
import type { statusOfEntity } from 'types/session-records';

export default function TestEntityStatus(properties: {
    status: statusOfEntity;
}): ReactNode {
    switch (properties.status) {
        case 'PASSED': {
            return <IconCheck color="green" size={20} strokeWidth={4} />;
        }
        case 'FAILED': {
            return <IconX color="red" size={20} strokeWidth={4} />;
        }
        case 'SKIPPED': {
            return <IconBounceRight color="yellow" size={20} strokeWidth={4} />;
        }
        case 'RETRIED': {
            return <IconRefresh color="orangered" size={20} strokeWidth={3} />;
        }
        case 'PENDING': {
            return <IconWalk color="blue" size={20} strokeWidth={4} />;
        }
        default: {
            return <></>;
        }
    }
}

export function TestEntityStatusMetrics(properties: {
    passed: number;
    failed: number;
    skipped: number;
    cn?: string;
}) {
    return (
        <Group
            gap={2}
            wrap="nowrap"
            justify="flex-start"
            className={properties.cn}
        >
            <Tooltip color="green.8" label="Passed">
                <Badge color="green.6" size="sm" variant="light">
                    {properties.passed}
                </Badge>
            </Tooltip>
            <Tooltip color="red.8" label="Failed">
                <Badge variant="light" color="red.9" size="sm">
                    {properties.failed}
                </Badge>
            </Tooltip>
            <Tooltip color="yellow.9" label="Skipped">
                <Badge color="yellow.9" size="sm" variant="light">
                    {properties.skipped}
                </Badge>
            </Tooltip>
        </Group>
    );
}

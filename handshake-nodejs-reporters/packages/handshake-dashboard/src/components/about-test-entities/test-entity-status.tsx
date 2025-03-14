import { Badge, Group, Tooltip } from '@mantine/core';
import React from 'react';

export default function TestEntityStatusMetrics(properties: {
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

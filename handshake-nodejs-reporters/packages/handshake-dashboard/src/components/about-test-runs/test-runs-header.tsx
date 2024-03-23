import type { ReactNode } from 'react';
import React from 'react';
import {
    Box,
    Breadcrumbs,
    Checkbox,
    CheckboxGroup,
    Divider,
    Group,
    rem,
    Text,
} from '@mantine/core';
import ApplicationName from 'components/about-test-runs/application-name';
import CountUpNumber from 'components/counter';
import { IconFilter } from '@tabler/icons-react';

export function TestRunsPageHeader(properties: {
    totalRuns: number;
}): ReactNode {
    return (
        <Group align="center">
            <Breadcrumbs>
                <ApplicationName />
                <Text size="sm">
                    Runs&nbsp;
                    <sup>
                        <CountUpNumber
                            prefix="("
                            suffix=")"
                            endNumber={properties.totalRuns}
                        />
                    </sup>
                </Text>
            </Breadcrumbs>
            <Group align="center">
                <IconFilter
                    color="white"
                    style={{ width: rem(15), height: rem(15) }}
                />
                <Divider orientation="vertical" />
                <Box></Box>
            </Group>
        </Group>
    );
}

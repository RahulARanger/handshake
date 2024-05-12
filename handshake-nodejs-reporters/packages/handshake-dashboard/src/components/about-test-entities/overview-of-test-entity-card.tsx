import type { TextProps } from '@mantine/core';
import {
    Badge,
    Card,
    Group,
    rem,
    RingProgress,
    ActionIcon,
    Select,
    Skeleton,
    Text,
    Tooltip,
    Grid,
    Table,
    Anchor,
    Box,
    Paper,
    Stack,
    ScrollAreaAutosize,
} from '@mantine/core';
import TestStatusRing from 'components/about-test-run/test-status-ring';
import { jsonFeedAboutTestRun, jsonFeedForSuite } from 'components/links';
import transformTestEntity, {
    spawnConverterForAnsiToHTML,
} from 'extractors/transform-test-entity';

import type { ReactNode } from 'react';
import React, { useMemo, useState } from 'react';
import useSWRImmutable from 'swr/immutable';

import type { SuiteRecordDetails } from 'types/test-entity-related';
import type { TestRunRecord } from 'types/test-run-records';

export default function OverviewCard(properties: {
    suiteID?: string;
    testID?: string;
}): ReactNode {
    const {
        data: run,
        isLoading: runFeedLoading,
        error: runFeedError,
    } = useSWRImmutable<TestRunRecord>(
        properties.testID ? jsonFeedAboutTestRun(properties.testID) : undefined,
        () =>
            fetch(jsonFeedAboutTestRun(properties.testID as string)).then(
                async (response) => response.json(),
            ),
    );

    const { data, isLoading, error } = useSWRImmutable<SuiteRecordDetails>(
        properties.testID && properties.suiteID
            ? jsonFeedForSuite(properties.testID, properties.suiteID)
            : undefined,
        () =>
            fetch(
                jsonFeedForSuite(
                    properties.testID as string,
                    properties.suiteID as string,
                ),
            ).then(async (response) => response.json()),
    );

    const suite = useMemo(() => {
        const converter = spawnConverterForAnsiToHTML();
        return data && transformTestEntity(data, run?.tests ?? 0, converter);
    }, [run?.tests, data]);

    const toLoad =
        isLoading ||
        runFeedLoading ||
        error !== undefined ||
        runFeedError !== undefined ||
        !data ||
        !run;

    const rateValues = suite?.Rate;
    const totalEntity = suite?.Tests;

    return (
        <ScrollAreaAutosize
            h={'calc(100vh - var(--app-shell-header-height, 0px))'}
            pt="md"
            pb="sm"
            pl="sm"
            scrollbars="y"
        >
            <Card p="sm" withBorder shadow="lg" radius="lg">
                <Card.Section p="sm" px="md" withBorder>
                    <Skeleton animate visible={isLoading}>
                        <Text size="sm"> {suite?.Title ?? ''}</Text>
                    </Skeleton>
                </Card.Section>
                <Stack>
                    <Card.Section p="sm">
                        <Grid columns={2}>
                            <Grid.Col span={0.8} pt={rem('5%')}>
                                <Card.Section>
                                    <TestStatusRing
                                        rateValues={rateValues}
                                        totalEntity={totalEntity}
                                        toLoad={toLoad}
                                        labelText={'Tests'}
                                    />
                                </Card.Section>
                            </Grid.Col>
                        </Grid>
                    </Card.Section>
                </Stack>
            </Card>
        </ScrollAreaAutosize>
    );
}

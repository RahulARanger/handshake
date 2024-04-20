import { Card, SimpleGrid, Skeleton, Text } from '@mantine/core';
import {
    jsonFeedAboutTestRun,
    jsonFeedForOverviewOfTestRun,
} from 'components/links';
import type {
    OverviewOfEntities,
    TransformedOverviewOfEntities,
} from 'extractors/transform-run-record';
import { transformOverviewFeed } from 'extractors/transform-run-record';
import type { ReactNode } from 'react';
import React, { useMemo } from 'react';
import useSWRImmutable from 'swr/immutable';
import { DataTable } from 'mantine-datatable';
import dayjs from 'dayjs';
import RelativeDate from 'components/timings/relative-date';
import type { specNode, TestRunRecord } from 'types/test-run-records';
import { HumanizedDuration } from 'components/timings/humanized-duration';
import PassedRate from './passed-rate';
import type { TooltipProps } from 'recharts';
import { ResponsiveContainer, Treemap, Tooltip as RToolTip } from 'recharts';

function fetchTree(root: specNode) {
    const subTree: unknown[] = [];
    const q = [[root, 'Root', subTree]];
    while (q.length > 0) {
        const item = q.pop() as Array<specNode | string | unknown[]>;
        const node = item[0] as specNode;
        const name = item[1] as string;
        const addTo = item[2] as unknown[];

        if (node['<count>'] !== undefined) {
            // addTo.push({ name, size: node['<count>'] });
            addTo.push({ name, size: 1, path: node['<path>'] });

            continue;
        }

        const children: unknown[] = [];
        addTo.push({ name, children });
        q.push(
            ...Object.keys(node)
                .filter((property) => !property.startsWith('<'))
                .map((property) => [node[property], property, children]),
        );
    }

    return subTree;
}

function CustomTooltip(properties: TooltipProps<string[], 'name' | 'size'>) {
    if (!properties.payload?.length) return <></>;
    const note = properties.payload[0];
    return (
        <Card>
            <Card.Section withBorder p="xs">
                <Text size="sm">{note.payload.name}</Text>
                <sub>
                    <Text fs="italic" size="xs">
                        {note.payload.path}
                    </Text>
                </sub>
            </Card.Section>
        </Card>
    );
}

function PreviewOfProjectStructure(properties: { testID?: string }) {
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

    const node = useMemo(
        () => run?.specStructure && fetchTree(JSON.parse(run?.specStructure)),
        [run?.specStructure],
    );

    const toLoad =
        node === undefined || runFeedLoading || runFeedError !== undefined;

    return (
        <Card w={'100%'} h={180} p="xs" radius="md" withBorder>
            {toLoad || !node ? (
                <Skeleton animate width={'100%'} height={180} />
            ) : (
                <ResponsiveContainer width="100%" height={'100%'}>
                    <Treemap
                        width={400}
                        height={180}
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        data={node as any[]}
                        dataKey="size"
                        stroke="#3a6186"
                        fill="#2c3e50"
                    >
                        <RToolTip content={<CustomTooltip />} />
                    </Treemap>
                </ResponsiveContainer>
            )}
            <Text
                style={{ position: 'absolute', bottom: '5%', right: '3%' }}
                size="xs"
            >
                Project Structure
            </Text>
        </Card>
    );
}

function PreviewTestSuites(properties: { testID?: string }): ReactNode {
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
    const {
        data: rawFeed,
        isLoading,
        error,
    } = useSWRImmutable<OverviewOfEntities>(
        properties.testID
            ? jsonFeedForOverviewOfTestRun(properties.testID)
            : undefined,
        () =>
            fetch(
                jsonFeedForOverviewOfTestRun(properties.testID as string),
            ).then(async (response) => response.json()),
    );

    const data = useMemo<TransformedOverviewOfEntities | undefined>(
        () => rawFeed && transformOverviewFeed(rawFeed),
        [rawFeed],
    );

    if (isLoading || error || !data || runFeedLoading || runFeedError || !run) {
        return <Skeleton animate w={'100%'} h={250} />;
    }

    return (
        <DataTable
            height={300}
            columns={[
                { accessor: 'Title', title: 'Title (Recent Test Suites)' },
                {
                    accessor: 'Started',
                    render: (record, index) => {
                        return (
                            <RelativeDate
                                date={record.Started}
                                relativeFrom={dayjs(run.started)}
                                showTime
                                key={index}
                            />
                        );
                    },
                    width: 100,
                },
                {
                    accessor: 'Duration',
                    render: (record, index) => {
                        return (
                            <HumanizedDuration
                                duration={record.Duration}
                                key={index}
                            />
                        );
                    },
                },
                {
                    accessor: 'Rate',
                    render: (record, index) => {
                        return (
                            <PassedRate
                                rate={record.Rate}
                                text="Entities"
                                key={index}
                                width={100}
                            />
                        );
                    },
                },
            ]}
            records={data?.recentSuites}
            striped
            highlightOnHover
            withColumnBorders
            shadow="md"
            withTableBorder
        />
    );
}

export default function PreviewTestRun(properties: {
    testID?: string;
}): ReactNode {
    return (
        <SimpleGrid cols={1}>
            <PreviewOfProjectStructure testID={properties.testID} />
            <Card withBorder radius={'md'} p={'xs'}>
                <PreviewTestSuites testID={properties.testID} />
            </Card>
        </SimpleGrid>
    );
}

import {
    Badge,
    Card,
    Group,
    rem,
    ScrollAreaAutosize,
    Skeleton,
    Text,
    Tooltip,
} from '@mantine/core';
import { jsonFeedForOverviewOfTestRun } from 'components/links';
import type {
    MiniSuitePreview,
    OverviewOfEntities,
    TransformedOverviewOfEntities,
} from 'extractors/transform-run-record';
import { transformOverviewFeed } from 'extractors/transform-run-record';
import type { ReactNode } from 'react';
import React, { useMemo } from 'react';
import useSWRImmutable from 'swr/immutable';
import DataGrid from 'react-data-grid';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import RelativeDate from 'components/timings/relative-date';
import type { specNode, specStructure } from 'types/test-run-records';
import { HumanizedDuration } from 'components/timings/humanized-duration';
import PassedRate from './passed-rate';
import type { TooltipProps } from 'recharts';
import { ResponsiveContainer, Treemap, Tooltip as RToolTip } from 'recharts';
import { IconArrowsHorizontal } from '@tabler/icons-react';
import GridStyles from 'styles/data-table.module.css';
import GradientStyles from 'styles/gradients.module.css';
import type { DetailedTestRecord } from 'types/parsed-records';
import CountUpNumber from 'components/counter';

type treeNode = {
    name: string;
    path: string;
    size: number;
    children?: treeNode[];
};

function fetchTree(root: specStructure) {
    const subTree: treeNode[] = [];
    const q: Array<[specNode, string, treeNode[]]> = Object.keys(root).map(
        (node) => [root[node], node, subTree],
    );

    while (q && q.length > 0) {
        const [node, name, addTo] = q.pop() as [specNode, string, treeNode[]];

        if (Object.keys(node.paths ?? []).length === 0) {
            addTo.push({
                name,
                path: node.current,
                size: node.suites ?? 1,
            });
            continue;
        }

        const children: treeNode[] = [];
        addTo.push({
            name,
            children,
            size: node.suites ?? 1,
            path: node.current,
        });

        q.push(
            ...(Object.keys(node?.paths ?? []).map((child) => [
                (node?.paths ?? {})[child],
                child,
                children,
            ]) as Array<[specNode, string, treeNode[]]>),
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
                <Text size="sm" aria-label="file-name">
                    {note.payload.name}
                </Text>
                <sub aria-label="file-details">
                    <Group wrap="nowrap" align="baseline">
                        <Text fs="italic" size="xs" aria-label="file-path">
                            {note.payload.path}
                        </Text>
                        <CountUpNumber
                            endNumber={note.payload.size ?? 1}
                            prefix="Tests: "
                            style={{ fontStyle: 'italic', fontSize: '.69rem' }}
                        />
                    </Group>
                </sub>
            </Card.Section>
        </Card>
    );
}

export function PreviewOfProjectStructure(properties: {
    specStructure?: specStructure;
    quick?: boolean;
    w?: string;
}): ReactNode {
    const node = useMemo(
        () => properties.specStructure && fetchTree(properties.specStructure),
        [properties.specStructure],
    );

    const toLoad = properties.specStructure === undefined || !node;
    const h = 192;

    return (
        <>
            {toLoad ? (
                <Skeleton
                    color="#820164"
                    animate
                    width={properties.w ?? '100%'}
                    aria-label="loading-project-structure"
                    height={h}
                />
            ) : (
                <ResponsiveContainer height={h} width={properties.w ?? '100%'}>
                    <Treemap
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        data={node as any[]}
                        height={h}
                        dataKey="size"
                        stroke="white"
                        fill="#820164"
                        nameKey={'name'}
                        type="flat"
                        animationDuration={properties.quick ? 0 : undefined}
                    >
                        <RToolTip content={<CustomTooltip />} />
                    </Treemap>
                </ResponsiveContainer>
            )}
        </>
    );
}

function PreviewTestSuites(properties: {
    recentSuites: MiniSuitePreview[];
    runStartedAt: Dayjs;
}): ReactNode {
    return (
        <DataGrid
            columns={[
                {
                    key: 'Title',
                    name: (
                        <Group
                            justify="space-between"
                            align="center"
                            style={{ height: '100%', width: '100%' }}
                        >
                            <Text fw="bold" size="sm">
                                Title
                            </Text>
                            <IconArrowsHorizontal size={16} />
                        </Group>
                    ),
                    width: 200,
                    resizable: true,
                    cellClass: GridStyles.cell,
                    headerCellClass: GridStyles.cell,
                },
                {
                    key: 'Started',
                    name: 'Started',
                    width: 120,
                    resizable: false,
                    renderCell: ({ row, rowIdx }) => (
                        <RelativeDate
                            date={row.Started}
                            relativeFrom={properties.runStartedAt}
                            showTime
                            key={rowIdx}
                            height={45}
                            relativeAlias="Test Run Start"
                        />
                    ),
                    cellClass: GridStyles.cell,
                    headerCellClass: GridStyles.cell,
                },
                {
                    key: 'Duration',
                    name: 'Duration',
                    resizable: false,
                    width: 120,
                    renderCell: ({ row, rowIdx }) => {
                        return (
                            <HumanizedDuration
                                duration={row.Duration}
                                key={rowIdx}
                            />
                        );
                    },
                    cellClass: GridStyles.cell,
                    headerCellClass: GridStyles.cell,
                },
                {
                    name: 'Rate',
                    key: 'Rate',
                    resizable: false,
                    width: 'max-content',
                    renderCell: ({ row, rowIdx }) => {
                        return (
                            <PassedRate
                                rate={row.Rate}
                                text="Entities"
                                width={'100%'}
                                key={rowIdx}
                                minWidth={200}
                            />
                        );
                    },
                    cellClass: GridStyles.cell,
                    headerCellClass: GridStyles.cell,
                },
            ]}
            rows={properties.recentSuites}
            rowKeyGetter={(row) => row.Id}
            headerRowHeight={35}
            rowHeight={45}
            className={GridStyles.table}
            rowClass={(_, rowIndex) =>
                rowIndex % 2 === 0 ? GridStyles.evenRow : GridStyles.oddRow
            }
        />
    );
}

export default function PreviewTestRun(properties: {
    run?: DetailedTestRecord;
}): ReactNode {
    const run = properties.run;
    const {
        data: rawFeed,
        isLoading,
        error,
    } = useSWRImmutable<OverviewOfEntities>(
        run?.Id ? jsonFeedForOverviewOfTestRun(run.Id) : undefined,
        () =>
            fetch(jsonFeedForOverviewOfTestRun(run?.Id as string)).then(
                async (response) => response.json(),
            ),
    );

    const data = useMemo<TransformedOverviewOfEntities | undefined>(
        () => rawFeed && transformOverviewFeed(rawFeed),
        [rawFeed],
    );

    const toLoad = run === undefined || isLoading || error || !data;

    return (
        <Card
            h={'calc(95vh - var(--app-shell-header-height, 0px))'}
            p="sm"
            mr="sm"
            mt="md"
            mb="sm"
            withBorder
            shadow="lg"
            radius="lg"
        >
            <Card.Section
                p="sm"
                px="md"
                pt="md"
                style={{ height: rem(53) }}
                withBorder
            >
                <Group align="baseline" wrap="nowrap">
                    {(run?.Tags ?? [])?.map((tag) => (
                        <Tooltip key={tag.name} label={tag.label} color="cyan">
                            <Badge size="sm" variant="light" color="cyan.9">
                                {tag.name}
                            </Badge>
                        </Tooltip>
                    ))}
                </Group>
                <Group justify="space-between" align="center" wrap="nowrap">
                    <Text size="sm"> More about Test Run</Text>
                    <Group>
                        {properties.run?.projectIndex === 0 ? (
                            <Badge
                                color="blue.9"
                                variant="light"
                                title={
                                    run?.timelineIndex === 0
                                        ? 'Recent Test Run'
                                        : `Recent Test Run of ${run?.projectName}`
                                }
                            >
                                Recent Run
                            </Badge>
                        ) : (
                            <></>
                        )}
                    </Group>
                </Group>
            </Card.Section>

            <Card.Section
                p="sm"
                withBorder
                className={GradientStyles.dottedOnes}
            >
                <PreviewOfProjectStructure specStructure={run?.specStructure} />
            </Card.Section>
            {toLoad ? (
                <Skeleton animate w={'100%'} h={250} />
            ) : (
                <Card.Section withBorder>
                    <ScrollAreaAutosize p="sm" h={250} w={'100%'}>
                        <PreviewTestSuites
                            recentSuites={data.recentSuites}
                            runStartedAt={dayjs(run.Started)}
                        />
                    </ScrollAreaAutosize>
                </Card.Section>
            )}
        </Card>
    );
}

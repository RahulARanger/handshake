import React, { useState } from 'react';
import {
    Card,
    Group,
    Badge,
    Anchor,
    rem,
    Tooltip,
    Avatar,
    Menu,
    MenuTarget,
    MenuDropdown,
    MenuItem,
    Divider,
    Paper,
    Accordion,
    Text,
} from '@mantine/core';
import type { ReactNode } from 'react';
import type { DetailedTestRecord } from 'types/parsed-records';
import SwitchTestCases from 'components/test-case-switch';
import PassedRate from '../about-test-run/passed-rate';
import { HumanizedDuration } from 'components/timings/humanized-duration';
import { TimeRange } from 'components/timings/time-range';
import { dateFormatUsed } from 'components/timings/format';
import { OnPlatform } from 'components/about-test-run/platform-icon';
import {
    IconExclamationCircle,
    IconFileExcel,
    IconFlagPause,
    IconTagFilled,
} from '@tabler/icons-react';
import dayjs from 'dayjs';
import advancedFormat from 'dayjs/plugin/advancedFormat';

dayjs.extend(advancedFormat);

export default function TestRunCard(properties: {
    run: DetailedTestRecord;
}): ReactNode {
    const [isTests, setTests] = useState(false);

    const hasOptions = Boolean(properties.run.ExcelExportUrl);
    return (
        <Card shadow="lg" withBorder radius="md" pt="xs">
            <Card.Section inheritPadding pb={2} pt={0}>
                <Group justify="space-between" mt="md" mb="xs" wrap="nowrap">
                    <Menu trigger="hover" shadow="xl">
                        <MenuTarget>
                            <Anchor
                                href={properties.run.Link}
                                size="sm"
                                underline={hasOptions ? 'always' : 'hover'}
                            >
                                {properties.run.Started.format(dateFormatUsed)}
                            </Anchor>
                        </MenuTarget>
                        <MenuDropdown>
                            {properties.run.ExcelExportUrl ? (
                                <MenuItem
                                    color="green"
                                    leftSection={
                                        <IconFileExcel
                                            color="green"
                                            style={{
                                                width: rem(18),
                                                height: rem(18),
                                            }}
                                            stroke={2}
                                        />
                                    }
                                    component="a"
                                    href={properties.run.ExcelExportUrl}
                                >
                                    Excel Export
                                </MenuItem>
                            ) : (
                                <></>
                            )}
                        </MenuDropdown>
                    </Menu>
                    <Badge
                        size="xs"
                        variant="light"
                        radius={'sm'}
                        color="violet"
                        tt="none"
                    >
                        <TimeRange
                            startTime={properties.run.Started}
                            endTime={properties.run.Ended}
                            size="xs"
                        />
                    </Badge>
                    {properties.run.RunStatus === 'INTERRUPTED' ? (
                        <Tooltip label="This run was interrupted">
                            <Avatar size="sm" color="gray">
                                <IconFlagPause
                                    style={{
                                        width: rem(14),
                                        height: rem(14),
                                        color: '#cb4154',
                                    }}
                                    stroke={2}
                                />
                            </Avatar>
                        </Tooltip>
                    ) : (
                        <></>
                    )}
                    {properties.run.RunStatus === 'INTERNAL_ERROR' ? (
                        <Tooltip label="Encountered internal error in this test run">
                            <Avatar size="sm" color="gray">
                                <IconExclamationCircle
                                    style={{
                                        width: rem(14),
                                        height: rem(14),
                                        color: '#cb4154',
                                    }}
                                    stroke={2}
                                />
                            </Avatar>
                        </Tooltip>
                    ) : (
                        <></>
                    )}
                </Group>
                <Divider mt={-5} pb={10} />
            </Card.Section>

            <Card.Section p="sm" pt={0}>
                <Group justify="space-between" wrap="nowrap">
                    <PassedRate
                        width={231}
                        text={isTests ? ' Tests' : 'Suites'}
                        rate={
                            isTests
                                ? properties.run.Rate
                                : properties.run.SuitesSummary
                        }
                    />
                    <SwitchTestCases
                        onChange={setTests}
                        isDefaultTestCases={isTests}
                    />
                </Group>
            </Card.Section>
            <Card.Section px="sm" pb="sm">
                <Group justify="space-between" wrap="nowrap" align="center">
                    <Badge
                        tt="none"
                        size="xs"
                        variant="light"
                        radius={'sm'}
                        color="cyan"
                    >
                        <HumanizedDuration
                            duration={properties.run.Duration}
                            prefix="Ran for "
                            size="xs"
                        />
                    </Badge>
                    <Badge
                        size="xs"
                        variant="light"
                        color="pink.9"
                        maw={'50%'}
                        title={properties.run.projectName}
                    >
                        {properties.run.projectName}
                    </Badge>
                    <OnPlatform platform={properties.run.Platform} size="sm" />
                </Group>
            </Card.Section>
            {(properties.run.Tags ?? []).length > 0 ? (
                <>
                    <Card.Section>
                        <Accordion defaultValue="tags">
                            <Accordion.Item value="tags">
                                <Accordion.Control
                                    icon={<IconTagFilled size="1.3rem" />}
                                >
                                    <Group justify="space-between">
                                        <Text size="sm">Tags</Text>
                                        <Text
                                            size="xs"
                                            fs="italic"
                                        >{`(${properties.run.Tags.length})`}</Text>
                                    </Group>
                                </Accordion.Control>
                                <Accordion.Panel>
                                    <Group>
                                        {properties.run.Tags.map((tag) => (
                                            <Tooltip
                                                label={tag.label}
                                                key={tag.name}
                                            >
                                                <Paper
                                                    withBorder
                                                    p={2}
                                                    pb={3}
                                                    px="xs"
                                                    className="mirror"
                                                >
                                                    <Badge
                                                        variant="light"
                                                        size="xs"
                                                    >
                                                        {tag.name}
                                                    </Badge>
                                                </Paper>
                                            </Tooltip>
                                        ))}
                                    </Group>
                                </Accordion.Panel>
                            </Accordion.Item>
                        </Accordion>
                    </Card.Section>
                </>
            ) : (
                <></>
            )}
        </Card>
    );
}

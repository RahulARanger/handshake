import React, { useState } from 'react';
import { Card, Group, Badge, Anchor } from '@mantine/core';
import type { ReactNode } from 'react';
import type { DetailedTestRecord } from 'types/parsed-records';
import SwitchTestCases from 'components/test-case-switch';
import PassedRate from '../about-test-run/passed-rate';
import { HumanizedDuration } from 'components/timings/humanized-duration';
import { TimeRange } from 'components/timings/time-range';
import { FrameworksUsed } from '../about-test-run/framework-icons';
import { dateFormatUsed } from 'components/timings/format';

export default function TestRunCard(properties: {
    run: DetailedTestRecord;
}): ReactNode {
    const [isTests, setTests] = useState(false);

    return (
        <Card shadow="lg" withBorder radius="md" pt="xs">
            <Card.Section inheritPadding pb={2} pt={0}>
                <Group justify="space-between" mt="md" mb="xs" wrap="nowrap">
                    <Anchor href={properties.run.Link} size="sm">
                        {properties.run.Started.format(dateFormatUsed)}
                    </Anchor>
                    <Badge
                        size="xs"
                        variant="light"
                        color="pink.9"
                        maw={'50%'}
                        title={properties.run.projectName}
                    >
                        {properties.run.projectName}
                    </Badge>
                </Group>
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
                <Group justify="space-between" wrap="nowrap">
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
                    <FrameworksUsed
                        frameworks={properties.run.Frameworks}
                        size="xs"
                    />
                </Group>
            </Card.Section>
        </Card>
    );
}

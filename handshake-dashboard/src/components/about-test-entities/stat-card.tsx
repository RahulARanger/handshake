import {
    Card,
    Group,
    Paper,
    RingProgress,
    Stack,
    Text,
    TextProps,
    Tooltip,
} from '@mantine/core';
import TestStatusIcon, {
    standingToColors,
} from 'components/about-test-run/test-status';
import CountUpNumber from 'components/counter';
import { captialize, percentage } from 'components/meta-text';
import { ReactNode } from 'react';
import { DetailedTestRecord, ParsedSuiteRecord } from 'types/parsed-records';
import { statusOfEntity } from 'types/session-records';

function CustomStatValue(properties: {
    text: string;
    valueNode: ReactNode;
    replaceIcon: ReactNode;
    colorOfTitle: TextProps['c'];
    label?: string;
}) {
    return (
        <Tooltip label={properties.label ?? ''}>
            <Card p="sm" className="mirror">
                <Group align="center">
                    {properties.replaceIcon}
                    <Stack align="baseline">
                        <Text c={properties.colorOfTitle} fw={500} size="sm">
                            {captialize(properties.text)}
                        </Text>
                    </Stack>
                    {properties.valueNode}
                </Group>
            </Card>
        </Tooltip>
    );
}

function StatValue(properties: {
    status: statusOfEntity;
    value: number;
    total: number;
    replaceIcon?: ReactNode;
    isNotStatus?: boolean;
}) {
    return (
        <CustomStatValue
            text={properties.status}
            valueNode={
                <Group gap={0}>
                    <Text fw={500} size="sm">
                        {properties.value}
                    </Text>
                    <Text size="sm">/{properties.total}</Text>
                </Group>
            }
            colorOfTitle={standingToColors(properties.status)}
            replaceIcon={
                <TestStatusIcon status={properties.status} size={30} />
            }
            label={`${captialize(properties.status)} tests / Total tests in this suite`}
        />
    );
}

export default function StatCard(properties: {
    suite: ParsedSuiteRecord;
    testRecord: DetailedTestRecord;
}) {
    console.log("HERE", properties.suite)
    console.log("TEST", properties.testRecord)
    const percentageOfDuration = percentage(
        properties.suite.Duration.asSeconds(),
        properties.testRecord.Duration.asSeconds(),
    );
    const percentageFailedComparedToRun = percentage(
        properties.suite.RollupValues[1],
        properties.testRecord.Rate[1]
    );
    const isSuite = properties.suite.type === 'SUITE';
    return (
        <Paper m="xs" p="sm">
            <Stack>
                {isSuite && <Group justify="stretch">
                    <StatValue
                        status="PASSED"
                        value={properties.suite.RollupValues[0]}
                        total={properties.suite.totalRollupValue}
                    />
                    <StatValue
                        status="FAILED"
                        value={properties.suite.RollupValues[1]}
                        total={properties.suite.totalRollupValue}
                    />
                    <StatValue
                        status="SKIPPED"
                        value={properties.suite.RollupValues[2]}
                        total={properties.suite.totalRollupValue}
                    />
                    <StatValue
                        status="XFAILED"
                        value={properties.suite.RollupValues[3]}
                        total={properties.suite.totalRollupValue}
                    />
                    <StatValue
                        status="XPASSED"
                        value={properties.suite.RollupValues[4]}
                        total={properties.suite.totalRollupValue}
                    />
                </Group>}
                <Group justify="stretch">
                    {isSuite && <CustomStatValue
                        label="% number of tests in this suite w.r.t to entire test run"
                        replaceIcon={
                            <RingProgress
                                size={50}
                                thickness={6}
                                roundCaps
                                sections={[
                                    {
                                        value: properties.suite.Contribution,
                                        color: 'teal',
                                    },
                                ]}
                            />
                        }
                        text="Contribution"
                        colorOfTitle="teal"
                        valueNode={
                            <CountUpNumber
                                endNumber={properties.suite.Contribution}
                                suffix="%"
                                size="sm"
                                decimalPoints={2}
                                avoideAnimation
                            />
                        }
                    />}
                    <CustomStatValue
                        replaceIcon={
                            <RingProgress
                                size={50}
                                thickness={6}
                                roundCaps
                                sections={[
                                    {
                                        value: Number(percentageOfDuration),
                                        color: 'teal',
                                    },
                                ]}
                            />
                        }
                        text="Duration"
                        colorOfTitle="grape"
                        label="% Duration of this suite w.r.t to entire test run"
                        valueNode={
                            <CountUpNumber
                                endNumber={Number(percentageOfDuration)}
                                suffix="%"
                                size="sm"
                                decimalPoints={2}
                                avoideAnimation
                            />
                        }
                    />
                    {isSuite && <CustomStatValue
                        replaceIcon={
                            <RingProgress
                                size={50}
                                thickness={6}
                                roundCaps
                                sections={[
                                    {
                                        value: Number(
                                            percentageFailedComparedToRun,
                                        ),
                                        color: 'red',
                                    },
                                ]}
                            />
                        }
                        text="Failed Tests"
                        colorOfTitle="red"
                        label="% Failed Tests of this suite w.r.t to entire test run"
                        valueNode={
                            <CountUpNumber
                                endNumber={Number(
                                    percentageFailedComparedToRun,
                                )}
                                suffix="%"
                                size="sm"
                                decimalPoints={2}
                                avoideAnimation
                            />
                        }
                    />}
                </Group>
            </Stack>
        </Paper>
    );
}

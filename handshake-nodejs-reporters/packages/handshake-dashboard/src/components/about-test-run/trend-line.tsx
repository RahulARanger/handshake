import { Sparkline, SparklineProps } from '@mantine/charts';
import {
    Box,
    Card,
    Group,
    Skeleton,
    Text,
    TextProps,
    Tooltip,
} from '@mantine/core';

function colorFromChange(change: number, reverse?: boolean): TextProps['c'] {
    if (change === 0) return 'gray';
    const colors = ['red', 'green'];
    const colorIndex = Number(change > 0) ^ Number(reverse); // XOR operation
    return colors[colorIndex];
}
function indicateNumber(change: number, forceText?: string): string | number {
    if (change === 0) return change;
    return `${change > 0 ? '+' : ''}${forceText ?? change}`;
}

export default function TrendLine(properties: {
    trendFor: string;
    labelOnChangeText: string;
    changedNumber: number;
    forceText?: string;
    highlight?: boolean;
    data?: SparklineProps['data'];
}) {
    return (
        <Box p="xs">
            <Card.Section withBorder p="xs">
                <Group justify="space-between">
                    <Text
                        size="xs"
                        fw={properties.highlight ? 500 : undefined}
                        td={properties.highlight ? 'undefined' : undefined}
                    >
                        {properties.trendFor + 'Trend'}
                    </Text>
                    <Tooltip label={properties.labelOnChangeText}>
                        <Text
                            size="xs"
                            c={colorFromChange(properties.changedNumber, true)}
                        >
                            {indicateNumber(
                                properties.changedNumber,
                                properties.forceText,
                            )}
                        </Text>
                    </Tooltip>
                </Group>
            </Card.Section>
            {properties.data ? (
                <Sparkline
                    data={properties.data}
                    w={150}
                    trendColors={{
                        negative: 'green.6',
                        positive: 'red.6',
                        neutral: 'gray.5',
                    }}
                    h={70}
                />
            ) : (
                <Skeleton h={70} w={150} />
            )}
        </Box>
    );
}

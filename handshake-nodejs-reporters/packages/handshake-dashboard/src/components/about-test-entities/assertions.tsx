import type { PaperProps } from '@mantine/core';
import {
    ActionIcon,
    Card,
    Collapse,
    Group,
    Paper,
    rem,
    Stack,
    Text,
} from '@mantine/core';
import type { ReactNode } from 'react';
import React from 'react';
import type { AssertionRecord } from 'types/test-entity-related';
import { EmptyScreen } from './image-carousel';
import { useDisclosure } from '@mantine/hooks';
import { IconCaretDownFilled } from '@tabler/icons-react';
import AssertionCardStyles from 'styles/assertion.module.css';
import TextStyles from 'styles/text-styles.module.css';

export default function Assertions(properties: {
    assertions: AssertionRecord[];
    h?: PaperProps['h'];
}): ReactNode {
    return properties.assertions.length > 0 ? (
        <Stack p="sm">
            {properties.assertions.map((error, index) => (
                <AssertionCard assertion={error} key={index} />
            ))}
        </Stack>
    ) : (
        <EmptyScreen
            c="yellow"
            message="No Assertions were added"
            h={properties.h}
        />
    );
}

export function AssertionCard(properties: {
    assertion: AssertionRecord;
}): ReactNode {
    const [opened, { toggle }] = useDisclosure(false);

    return (
        <Card
            shadow="lg"
            withBorder
            radius="md"
            className={
                properties.assertion.passed
                    ? AssertionCardStyles.passed
                    : AssertionCardStyles.failed
            }
        >
            <Card.Section p="xs" withBorder={opened} onClick={toggle}>
                <Group justify="space-between" wrap="nowrap">
                    <Text size="sm" className={TextStyles.breakable}>
                        {properties.assertion.title}
                    </Text>
                    <ActionIcon size="xs" variant="light" onClick={toggle}>
                        <IconCaretDownFilled
                            style={{
                                width: rem(12),
                                height: rem(12),
                            }}
                            stroke={1.5}
                        />
                    </ActionIcon>
                </Group>
            </Card.Section>
            <Collapse in={opened} py="xs">
                <Card.Section p="sm">
                    <Paper shadow="md" withBorder radius="sm" p="sm">
                        <Text
                            size="xs"
                            style={{
                                wordWrap: 'break-word',
                                whiteSpace: 'break-spaces',
                            }}
                            dangerouslySetInnerHTML={{
                                __html: properties.assertion.message ?? '',
                            }}
                        />
                    </Paper>
                </Card.Section>
            </Collapse>
        </Card>
    );
}

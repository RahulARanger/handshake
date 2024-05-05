import {
    ActionIcon,
    Card,
    Collapse,
    Group,
    Paper,
    rem,
    Text,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconCaretDownFilled } from '@tabler/icons-react';
import type { ReactNode } from 'react';
import React from 'react';
import type { ErrorRecord } from 'types/test-entity-related';

export default function ErrorCard(properties: {
    error: ErrorRecord;
}): ReactNode {
    const [opened, { toggle }] = useDisclosure(false);

    return (
        <Card shadow="lg" withBorder radius="md">
            {/* <Card.Section p="xs" withBorder>
                <Text size="sm">{properties.error.mailedFrom}</Text>
            </Card.Section> */}

            <Card.Section p="xs" withBorder={opened} onClick={toggle}>
                <Group justify="space-between" wrap="nowrap">
                    <Text
                        size="sm"
                        dangerouslySetInnerHTML={{
                            __html: properties.error.message ?? '',
                        }}
                    />
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
                            dangerouslySetInnerHTML={{
                                __html: properties.error.stack ?? '',
                            }}
                        />
                    </Paper>
                </Card.Section>
            </Collapse>
        </Card>
    );
}

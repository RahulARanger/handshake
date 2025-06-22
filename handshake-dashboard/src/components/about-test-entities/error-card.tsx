import type { ModalProps, PaperProps } from '@mantine/core';
import {
    ActionIcon,
    Card,
    Collapse,
    Group,
    Modal,
    Paper,
    rem,
    Stack,
    Text,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconCaretDownFilled } from '@tabler/icons-react';
import type { ReactNode } from 'react';
import React from 'react';
import type { ErrorRecord } from 'types/test-entity-related';
import { EmptyScreen } from './image-carousel';
import hoverStyles from 'styles/hover.module.css';

export function ErrorsToShow(properties: {
    errorsToShow: ErrorRecord[];
    opened: boolean;
    onClose: ModalProps['onClose'];
}): ReactNode {
    return (
        <Modal
            opened={properties.opened && properties.errorsToShow.length > 0}
            onClose={properties.onClose}
            title={`Errors (${properties.errorsToShow.length})`}
            centered
            size="lg"
        >
            <ErrorStack errors={properties.errorsToShow} />
        </Modal>
    );
}

export function ErrorStack(properties: {
    errors: ErrorRecord[];
    h?: PaperProps['h'];
}): ReactNode {
    return properties.errors.length > 0 ? (
        <Stack p="sm">
            {properties.errors.map((error, index) => (
                <ErrorCard error={error} key={index} />
            ))}
        </Stack>
    ) : (
        <EmptyScreen c="green" message="No Errors" h={properties.h} />
    );
}

export default function ErrorCard(properties: {
    error: ErrorRecord;
}): ReactNode {
    const [opened, { toggle }] = useDisclosure(false);

    return (
        <Card
            shadow="lg"
            withBorder
            radius="md"
            className={`mirror ${hoverStyles.errorCard}`}
        >
            {/* <Card.Section p="xs" withBorder>
                <Text size="sm">{properties.error.mailedFrom}</Text>
            </Card.Section> */}

            <Card.Section p="xs" withBorder={opened} onClick={toggle}>
                <Group justify="space-between" wrap="nowrap">
                    <Group
                        align="baseline"
                        justify="flex-start"
                        wrap="nowrap"
                        gap={0}
                    >
                        <Text fs="italic" size="sm">
                            {properties.error.name + ':'}
                        </Text>
                        &nbsp;
                        <Text
                            size="sm"
                            style={{
                                wordWrap: 'break-word',
                                whiteSpace: 'break-spaces',
                            }}
                            dangerouslySetInnerHTML={{
                                __html: properties.error.message ?? '',
                            }}
                        />
                    </Group>
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
                                __html: properties.error.stack ?? '',
                            }}
                        />
                    </Paper>
                </Card.Section>
            </Collapse>
        </Card>
    );
}

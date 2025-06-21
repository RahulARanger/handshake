import type { AvatarProps, TooltipProps } from '@mantine/core';
import {
    Avatar,
    AvatarGroup,
    Modal,
    Paper,
    Table,
    Text,
    Tooltip,
} from '@mantine/core';
import { uniqBy } from 'lodash-es';
import React from 'react';
import type { ReactNode } from 'react';
import type { possibleEntityNames } from 'types/session-records';

export type PlatformDetails = Array<{
    entityName: possibleEntityNames;
    entityVersion: string;
    simplified: string;
}>;

export default function PlatformEntity(properties: {
    entityNames: string[];
    size?: AvatarProps['size'];
    c?: string;
    moveRight?: boolean;
}): ReactNode {
    const avatars = properties.entityNames.map((entityName) => {
        const note = entityName.toLowerCase() as possibleEntityNames;
        let source = '';
        let key = `not-yet-noted-platform`;
        let color: TooltipProps['color'] = 'orange.7';

        if (note.includes('chrome')) {
            source = '/chrome.png';
            color = 'yellow';
            key = 'chrome';
        }
        if (note.includes('firefox')) {
            source = '/firefox.png';
            key = 'firefox';
        }
        if (note.includes('edge')) {
            color = 'blue.9';
            source = '/edge.png';
            key = 'edge';
        }

        return (
            <Tooltip
                label={entityName}
                key={entityName}
                color={source ? color : 'red'}
            >
                <Avatar
                    src={source}
                    size={properties.size ?? 'md'}
                    alt={entityName}
                    aria-label={source ? `${key}-platform` : key}
                />
            </Tooltip>
        );
    });

    return (
        <AvatarGroup
            ml={properties.moveRight ? 3 : undefined}
            className={properties.c}
        >
            {avatars}
        </AvatarGroup>
    );
}

export function DetailedPlatformVersions(properties: {
    records: PlatformDetails;
    opened: boolean;
    onClose: () => void;
    title: string;
}): ReactNode {
    const records = uniqBy(properties.records, 'simplified');
    return (
        <Modal
            opened={properties.opened}
            onClose={properties.onClose}
            title={properties.title}
            centered
            size="lg"
        >
            <Paper withBorder radius="md">
                <Table>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th w={160}>Platform Name</Table.Th>
                            <Table.Th w={140}>Platform Version</Table.Th>
                            <Table.Th>Summarized</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {records.map((record) => (
                            <Table.Tr key={record.simplified}>
                                <Table.Td>{record.entityName}</Table.Td>
                                <Table.Td>
                                    <PlatformEntity
                                        entityNames={[record.entityName]}
                                        size="sm"
                                    />
                                </Table.Td>
                                <Table.Td>
                                    <Text c="dimmed" size="sm">
                                        {record.simplified}
                                    </Text>
                                </Table.Td>
                            </Table.Tr>
                        ))}
                    </Table.Tbody>
                </Table>
            </Paper>
        </Modal>
    );
}

import type { TooltipProps } from '@mantine/core';
import { Avatar, Group, Text, Tooltip } from '@mantine/core';
import React from 'react';
import type { ReactNode } from 'react';
import type { possibleEntityNames } from 'types/session-records';

export default function PlatformEntity(properties: {
    entityName: possibleEntityNames;
    entityVersion: string;
    simplified: string;
}): ReactNode {
    const note = properties.entityName.toLowerCase();
    let source = '';
    let color: TooltipProps['color'] = 'orange.7';

    if (note.includes('chrome')) {
        source = '/chrome.png';
        color = 'yellow';
    }
    if (note.includes('firefox')) source = '/firefox.png';
    if (note.includes('edge')) {
        color = 'blue.9';
        source = '/edge.png';
    }

    return (
        <Tooltip label={properties.simplified} color={color}>
            <Group align="flex-end">
                <Avatar src={source} alt={properties.simplified} />
                <Text
                    size="xs"
                    style={{
                        position: 'relative',
                        right: '22%',
                        bottom: '-1px',
                    }}
                >
                    <sub>{properties.entityVersion}</sub>
                </Text>
            </Group>
        </Tooltip>
    );
}

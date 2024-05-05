import type { AvatarProps, TooltipProps } from '@mantine/core';
import { Avatar, AvatarGroup, Tooltip } from '@mantine/core';
import { uniqBy } from 'lodash-es';
import React from 'react';
import type { ReactNode } from 'react';
import type { possibleEntityNames } from 'types/session-records';

export default function PlatformEntity(properties: {
    records: Array<{
        entityName: possibleEntityNames;
        entityVersion: string;
        simplified: string;
    }>;
    size?: AvatarProps['size'];
}): ReactNode {
    const avatars = uniqBy(properties.records, 'entityName').map(
        ({ entityName }) => {
            const note = entityName.toLowerCase();
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
                <Tooltip label={entityName} key={entityName} color={color}>
                    <Avatar
                        src={source}
                        size={properties.size ?? 'md'}
                        alt={entityName}
                        aria-label={
                            source
                                ? `${note}-platform`
                                : `not-yet-noted-platform`
                        }
                    />
                </Tooltip>
            );
        },
    );

    return <AvatarGroup>{avatars}</AvatarGroup>;
}

import type { TooltipProps } from '@mantine/core';
import { Tooltip } from '@mantine/core';
import {
    IconCheck,
    IconFlagPause,
    IconRefreshDot,
    IconX,
} from '@tabler/icons-react';
import React, { type ReactNode } from 'react';
import type { statusOfEntity } from 'types/session-records';

export function standingToColors(
    status: statusOfEntity,
): TooltipProps['color'] {
    switch (status) {
        case 'PASSED': {
            return 'green';
        }
        case 'FAILED': {
            return 'red';
        }

        case 'SKIPPED': {
            return 'yellow';
        }
        case 'PENDING': {
            return 'gray';
        }
        case 'RETRIED': {
            return 'orange';
        }
    }
}

export default function TestStatusIcon(properties: {
    status: statusOfEntity;
}): ReactNode {
    let icon = <></>;

    switch (properties.status) {
        case 'PASSED': {
            icon = (
                <IconCheck
                    color="var(--mantine-color-green-filled)"
                    stroke={5}
                />
            );
            break;
        }
        case 'FAILED': {
            icon = <IconX color="var(--mantine-color-red-filled)" stroke={5} />;
            break;
        }

        case 'SKIPPED': {
            icon = (
                <IconFlagPause
                    color="var(--mantine-color-yellow-filled)"
                    stroke={1.5}
                />
            );
            break;
        }

        case 'RETRIED': {
            icon = (
                <IconRefreshDot
                    color="var(--mantine-color-orange-filled)"
                    stroke={1.5}
                />
            );
            break;
        }

        case 'PENDING': {
            icon = (
                <IconFlagPause
                    color="var(--mantine-color-yellow-filled)"
                    stroke={3}
                />
            );
            break;
        }
    }

    return (
        <Tooltip
            label={properties.status}
            color={standingToColors(properties.status)}
        >
            {icon}
        </Tooltip>
    );
}

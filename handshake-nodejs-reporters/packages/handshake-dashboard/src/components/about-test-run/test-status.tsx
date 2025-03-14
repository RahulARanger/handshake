import type { TooltipProps } from '@mantine/core';
import { Tooltip } from '@mantine/core';
import {
    IconCheck,
    IconFlagPause,
    IconPlayerSkipForwardFilled,
    IconRefreshDot,
    IconRosetteDiscountCheckOff,
    IconTestPipe,
    IconX,
} from '@tabler/icons-react';
import { captialize } from 'components/meta-text';
import React, { type ReactNode } from 'react';
import type { statusOfEntity } from 'types/session-records';

export function standingToColors(
    status: statusOfEntity,
    bgColor?: boolean,
): TooltipProps['color'] {
    switch (status.toUpperCase()) {
        case 'PASSED': {
            return bgColor ? 'lime' : 'green';
        }
        case 'FAILED': {
            return bgColor ? 'red' : 'red';
        }
        case 'SKIPPED': {
            return bgColor ? 'yellow' : 'yellow';
        }
        case 'PENDING': {
            return bgColor ? 'orange' : 'gray';
        }
        case 'RETRIED': {
            return bgColor ? 'orange' : 'indigo';
        }
        case 'XFAILED': {
            return bgColor ? 'orange' : 'orange';
        }
        case 'XPASSED': {
            return bgColor ? 'indigo' : 'teal';
        }
        default: {
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
                <IconPlayerSkipForwardFilled
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

        case 'XFAILED': {
            icon = (
                <IconTestPipe
                    color="var(--mantine-color-orange-filled)"
                    stroke={3}
                />
            );
            break;
        }

        case 'XPASSED': {
            icon = (
                <IconRosetteDiscountCheckOff
                    color="var(--mantine-color-teal-filled)"
                    stroke={2}
                />
            );
            break;
        }
    }

    return (
        <Tooltip
            label={captialize(properties.status)}
            color={standingToColors(properties.status)}
        >
            {icon}
        </Tooltip>
    );
}

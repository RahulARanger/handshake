import type { statusOfEntity } from 'types/session-records';
import type { BadgeProps } from 'antd/lib';
import type { TimelineItemProps } from 'antd/lib';

export function badgeStatus(status: string): BadgeProps['status'] {
    switch (status as statusOfEntity) {
        case 'FAILED': {
            return 'error';
        }
        case 'PASSED': {
            return 'success';
        }
        case 'PENDING': {
            return 'processing';
        }
        case 'SKIPPED': {
            return 'warning';
        }
    }
}

export function timelineColor(status: string): TimelineItemProps['color'] {
    switch (status as statusOfEntity) {
        case 'FAILED': {
            return 'red';
        }
        case 'PASSED': {
            return 'green';
        }
        case 'PENDING': {
            return 'blue';
        }
        case 'SKIPPED': {
            return 'gray';
        }
    }
}

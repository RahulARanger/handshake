import {
    IconBounceRight,
    IconCheck,
    IconRefresh,
    IconWalk,
    IconX,
} from '@tabler/icons-react';
import type { ReactNode } from 'react';
import React from 'react';
import type { statusOfEntity } from 'types/session-records';

export default function TestEntityStatus(properties: {
    status: statusOfEntity;
}): ReactNode {
    switch (properties.status) {
        case 'PASSED': {
            return <IconCheck color="green" size={20} strokeWidth={4} />;
        }
        case 'FAILED': {
            return <IconX color="red" size={20} strokeWidth={4} />;
        }
        case 'SKIPPED': {
            return <IconBounceRight color="yellow" size={20} strokeWidth={4} />;
        }
        case 'RETRIED': {
            return <IconRefresh color="orangered" size={20} strokeWidth={3} />;
        }
        case 'PENDING': {
            return <IconWalk color="blue" size={20} strokeWidth={4} />;
        }
        default: {
            return <></>;
        }
    }
}

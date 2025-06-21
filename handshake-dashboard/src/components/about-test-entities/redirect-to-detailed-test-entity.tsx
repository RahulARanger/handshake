import { ActionIcon, rem } from '@mantine/core';
import { IconExternalLink } from '@tabler/icons-react';
import { suiteDetailedPage } from 'components/links';
import type { ReactNode } from 'react';
import React from 'react';

export default function RedirectToTestEntity(properties: {
    testID: string;
    suiteID: string;
    redirectTo?: (url: string) => void;
}): ReactNode {
    return (
        <ActionIcon
            onClick={() =>
                properties.redirectTo &&
                properties.redirectTo(
                    suiteDetailedPage(properties.testID, properties.suiteID),
                )
            }
            size="sm"
            variant="light"
        >
            <IconExternalLink
                style={{
                    width: rem(15),
                    height: rem(15),
                }}
                stroke={1.5}
            />
        </ActionIcon>
    );
}

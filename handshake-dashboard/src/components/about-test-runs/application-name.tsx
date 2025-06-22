import type { AnchorProps } from '@mantine/core';
import { Anchor, Badge, Text } from '@mantine/core';
import { TEXT } from '@hand-shakes/utils';
import type { ReactNode } from 'react';
import React from 'react';

export default function ApplicationName(properties: {
    showLink?: boolean;
    size?: AnchorProps['size'];
}): ReactNode {
    const name = 'Handshake 🫱🏻‍🫲🏾';
    return properties.showLink ? (
        <Anchor href={TEXT.REPO} size={properties.size}>
            {name}
            <sub>
                <Badge color="blue" size="xs" component="span">
                    BETA
                </Badge>
            </sub>
        </Anchor>
    ) : (
        <Text c="white" size={properties.size}>
            {name}
            <sub>
                <Badge color="blue" size="xs" component="span">
                    BETA
                </Badge>
            </sub>
        </Text>
    );
}

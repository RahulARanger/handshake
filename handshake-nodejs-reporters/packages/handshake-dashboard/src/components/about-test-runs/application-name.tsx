import type { AnchorProps } from '@mantine/core';
import { Anchor, Text } from '@mantine/core';
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
        </Anchor>
    ) : (
        <Text c="white" size={properties.size}>
            {name}
        </Text>
    );
}

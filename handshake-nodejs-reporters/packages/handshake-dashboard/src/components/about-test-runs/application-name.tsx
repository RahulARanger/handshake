import { Anchor, Text } from '@mantine/core';
import { TEXT } from 'handshake-utils';
import type { ReactNode } from 'react';
import React from 'react';

export default function ApplicationName(properties: {
    showLink?: boolean;
}): ReactNode {
    const name = 'Handshake 🫱🏻‍🫲🏾';
    return properties.showLink ? (
        <Anchor href={TEXT.REPO}>{name}</Anchor>
    ) : (
        <Text c="white">{name}</Text>
    );
}

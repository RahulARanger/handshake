import type { AvatarProps } from '@mantine/core';
import { Avatar } from '@mantine/core';
import React from 'react';
import hoverStyles from 'styles/hover.module.css';

export function OnPlatform(properties: {
    platform: string;
    size?: AvatarProps['size'];
}) {
    let source = '';
    const target = (properties.platform ?? '').toLowerCase();

    if (target.startsWith('win')) source = '/windows.png';
    else if (target.startsWith('mac')) source = '/mac.png';
    else if (target.startsWith('linux')) source = '/linux.png';

    return (
        <Avatar
            size={properties.size ?? 'md'}
            radius={'xl'}
            src={source}
            alt={target}
            color="red"
            className={hoverStyles.clickIcon}
        />
    );
}

import type { BadgeProps } from 'antd/lib/badge/index';
import Badge from 'antd/lib/badge/index';
import React, { type ReactNode } from 'react';

export default function BadgeForSuiteType(props: {
    text: BadgeProps['count'];
    color: BadgeProps['color'];
    size?: BadgeProps['size'];
}): ReactNode {
    return (
        <Badge
            color={props.color}
            count={props.text}
            size={props.size}
            style={{ fontWeight: 'bold', color: 'white' }}
        />
    );
}

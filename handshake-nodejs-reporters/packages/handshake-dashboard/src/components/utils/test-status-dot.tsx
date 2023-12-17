import type { BadgeProps } from 'antd/lib/badge/index';
import Badge from 'antd/lib/badge/index';
import React, { type ReactNode } from 'react';

export default function BadgeForSuiteType(properties: {
    text: BadgeProps['count'];
    color: BadgeProps['color'];
    size?: BadgeProps['size'];
}): ReactNode {
    return (
        <Badge
            color={properties.color}
            count={properties.text}
            size={properties.size}
            style={{
                fontWeight: 'bold',
                color: 'white',
            }}
        />
    );
}

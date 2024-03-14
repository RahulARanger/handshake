import type { BadgeProps } from 'antd/lib/badge/index';
import Badge from 'antd/lib/badge/index';
import React, { type ReactNode } from 'react';
import type { suiteType } from 'types/test-entity-related';

export default function RenderTestType(properties: {
    value: suiteType;
    size?: BadgeProps['size'];
}): ReactNode {
    return (
        <Badge
            color={properties.value === 'SUITE' ? 'purple' : 'magenta'}
            count={properties.value}
            size={properties.size}
            style={{
                fontWeight: 'bold',
                color: 'white',
            }}
        />
    );
}

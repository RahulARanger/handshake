import type { ReactNode } from 'react';
import React from 'react';
import Space from 'antd/lib/space';
import Progress from 'antd/lib/progress/index';

export default function RenderProgress(properties: {
    passed?: number;
    failed?: number;
    skipped?: number;
}): ReactNode {
    const passed = properties?.passed ?? 0;
    const failed = properties?.failed ?? 0;
    const skipped = properties?.skipped ?? 0;
    const total = passed + failed + skipped;

    return (
        <Space
            align="baseline"
            style={{
                width: '100%',
                flexGrow: 2,
            }}
            size={20}
        >
            <Progress
                percent={Number(((passed / total) * 1e2).toFixed(2))}
                type="dashboard"
                strokeColor={'green'}
                gapDegree={40}
                size={85}
            />
            <Progress
                percent={Number(((failed / total) * 1e2).toFixed(2))}
                type="dashboard"
                strokeColor={'red'}
                gapDegree={40}
                size={85}
            />
            <Progress
                percent={Number(((skipped / total) * 1e2).toFixed(2))}
                type="dashboard"
                strokeColor={'yellow'}
                gapDegree={40}
                size={85}
            />
        </Space>
    );
}

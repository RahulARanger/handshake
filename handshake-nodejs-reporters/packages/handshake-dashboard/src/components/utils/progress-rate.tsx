import type { ReactNode } from 'react';
import React from 'react';
import Space from 'antd/lib/space';
import Progress from 'antd/lib/progress/index';
import { Tooltip } from 'antd/lib';
import Divider from 'antd/lib/divider/index';

export default function RenderProgress(properties: {
    passed?: number;
    failed?: number;
    skipped?: number;
    broken?: number;
}): ReactNode {
    const passed = properties?.passed ?? 0;
    const failed = properties?.failed ?? 0;
    const skipped = properties?.skipped ?? 0;
    const total = passed + failed + skipped;
    const failedPercent = Number(((failed / total) * 1e2).toFixed(2));

    return (
        <Space
            align="baseline"
            style={{
                width: '100%',
                flexGrow: 2,
            }}
            size={20}
        >
            <Tooltip title="Passed Test Cases %" color="green">
                <Progress
                    percent={Number(((passed / total) * 1e2).toFixed(2))}
                    type="dashboard"
                    strokeColor={'green'}
                    gapDegree={40}
                    size={85}
                />
            </Tooltip>
            <Tooltip title="Failed Test Cases %" color="red">
                <Progress
                    percent={failedPercent}
                    type="dashboard"
                    strokeColor={'red'}
                    gapDegree={40}
                    size={85}
                />
            </Tooltip>

            <Tooltip title="Skipped Test Cases %" color="yellow">
                <Progress
                    percent={Number(((skipped / total) * 1e2).toFixed(2))}
                    type="dashboard"
                    strokeColor={'yellow'}
                    gapDegree={40}
                    size={85}
                />
            </Tooltip>
            {properties.broken ? (
                <Divider type="vertical" style={{ height: '40px' }} />
            ) : (
                <></>
            )}
            {properties.broken ? (
                <Tooltip
                    title={`Broken Test Cases (out of ${failedPercent}%)`}
                    color="volcano"
                >
                    <Progress
                        percent={Number(
                            ((properties.broken / total) * 1e2).toFixed(2),
                        )}
                        type="dashboard"
                        strokeColor={'volcano'}
                        gapDegree={40}
                        size={85}
                    />
                </Tooltip>
            ) : (
                <></>
            )}
        </Space>
    );
}

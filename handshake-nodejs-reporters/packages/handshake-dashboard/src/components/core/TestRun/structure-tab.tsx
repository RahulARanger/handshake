import Dotted from '@/styles/dotted.module.css';
import React, { useContext, type ReactNode, useState, useMemo } from 'react';
import Space from 'antd/lib/space';
import Text from 'antd/lib/typography/Text';
import Card from 'antd/lib/card/Card';
import Counter from '@/components/utils/counter';
import { Tooltip } from 'antd/lib';
import TreeMapComponent, { treeData } from '@/components/charts/tree-map';
import type { StatusContext } from '@/types/transfer-structure-context';
import { RenderStatus } from '@/components/utils/renderers';
import RenderTestType from '@/components/utils/test-status-dot';
import { DetailedContext } from '@/types/records-in-detailed';
import type { specNode } from '@/types/test-run-records';
import type { SuiteDetails } from '@/types/parsed-records';

function MousedPart(properties: { info?: StatusContext }): ReactNode {
    if (properties?.info === undefined)
        return (
            <Text style={{ fontStyle: 'italic' }}>
                Double click on any suite to drill down
            </Text>
        );

    return (
        <>
            <Space>
                {properties.info.isPath ? (
                    <Text>{properties.info.isFile ? '📄' : '📂'}</Text>
                ) : (
                    <RenderStatus value={properties.info.status} />
                )}
                {properties.info.isFile ? (
                    <> </>
                ) : (
                    <RenderTestType value="SUITE" />
                )}
                <Text>{properties.info?.title}</Text>
            </Space>
        </>
    );
}

function SuiteStatus(properties: { info?: StatusContext }): ReactNode {
    if (properties?.info === undefined)
        return (
            <Text style={{ fontStyle: 'italic' }}>
                Mouse over to view the details
            </Text>
        );

    return (
        <Tooltip
            defaultOpen
            placement="bottomRight"
            title="Passed > Failed > Skipped"
        >
            <Space>
                <Counter
                    end={properties.info.passed}
                    cssClassName={Dotted.greenGlowText}
                    style={{
                        fontSize: '1.0009rem',
                    }}
                />
                <Counter
                    cssClassName={Dotted.redGlowText}
                    end={properties.info.failed}
                    style={{
                        fontSize: '1.0009rem',
                    }}
                />
                <Counter
                    cssClassName={Dotted.yellowGlowText}
                    end={properties.info.skipped}
                    style={{
                        fontSize: '1.0009rem',
                    }}
                />
            </Space>
        </Tooltip>
    );
}

// export function treeViewData(props: {})

export default function ProjectStructure(properties: {
    setTestID: (testID: string) => void;
}): ReactNode {
    const [hovered, setHovered] = useState<StatusContext>();

    const context = useContext(DetailedContext);

    const treeMapData = useMemo(
        () =>
            treeData(
                context?.detailsOfTestRun?.specStructure ??
                    ({ '<path>': '' } as specNode),
                context?.suites ?? ({} as SuiteDetails),
            ),
        [context?.detailsOfTestRun, context?.suites],
    );
    if (context == undefined) return <></>;

    const { suites } = context;

    return (
        <Card
            type="inner"
            className={Dotted.dotted}
            title={<MousedPart info={hovered} />}
            extra={<SuiteStatus info={hovered} />}
        >
            <TreeMapComponent
                suites={suites}
                setHovered={setHovered}
                data={treeMapData}
                onClick={properties.setTestID}
            />
        </Card>
    );
}

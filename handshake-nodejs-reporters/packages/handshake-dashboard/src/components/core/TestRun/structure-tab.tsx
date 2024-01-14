import Dotted from 'src/styles/dotted.module.css';
import React, { useContext, type ReactNode, useState } from 'react';
import Space from 'antd/lib/space';
import Text from 'antd/lib/typography/Text';
import Card from 'antd/lib/card/Card';
import Counter from 'src/components/utils/counter';
import { Tooltip } from 'antd/lib';
import TreeMapComponent from 'src/components/charts/tree-map';
import type { StatusContext } from 'src/types/transfer-structure-context';
import { RenderStatus } from 'src/components/utils/renderers';
import RenderTestType from 'src/components/utils/test-status-dot';
import { DetailedContext } from 'src/types/records-in-detailed';

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

export default function ProjectStructure(properties: {
    setTestID: (testID: string) => void;
}): ReactNode {
    const [hovered, setHovered] = useState<StatusContext>();

    const context = useContext(DetailedContext);
    if (context == undefined) return <></>;

    const { suites, detailsOfTestRun } = context;
    const structure = detailsOfTestRun.specStructure;

    return (
        <Card
            type="inner"
            className={Dotted.dotted}
            title={<MousedPart info={hovered} />}
            extra={<SuiteStatus info={hovered} />}
        >
            <TreeMapComponent
                suites={suites}
                node={structure}
                setHovered={setHovered}
                onClick={properties.setTestID}
            />
        </Card>
    );
}

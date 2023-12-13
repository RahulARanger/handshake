import type TestRunRecord from 'src/types/test-run-records';
import type {
    SessionDetails,
    SuiteDetails,
} from 'src/types/generated-response';
import type { specNode } from 'src/types/test-run-records';
import {
    getSessions,
    getSuites,
    getTestRun,
} from 'src/components/scripts/helper';
import { RenderEntityType, RenderStatus } from 'src/components/utils/renderers';
import RenderPassedRate from 'src/components/charts/stacked-bar-chart';
import MetaCallContext from './context';

import React, { useContext, type ReactNode, useMemo } from 'react';
import ExpandAltOutlined from '@ant-design/icons/ExpandAltOutlined';
import Button from 'antd/lib/button/button';
import useSWR from 'swr';
import Space from 'antd/lib/space';
import DirectoryTree from 'antd/lib/tree/DirectoryTree';
import type { DataNode } from 'antd/es/tree';
import Typography from 'antd/lib/typography/Typography';
import Text from 'antd/lib/typography/Text';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { timeFormatUsed } from 'src/components/utils/Datetime/format';
import { parseDetailedTestEntity } from 'src/components/parse-utils';

function treeData(
    node: specNode,
    suites: SuiteDetails,
    setTestID: (testID: string) => void,
    started: Dayjs,
    sessions: SessionDetails,
): DataNode[] {
    const root: DataNode = { title: 'Root', key: '', children: [] };
    const structure: DataNode[] = [root];
    const pulled = new Set(suites['@order']);
    const nodes = [{ node, childrenSpace: root.children, pathNode: root }];
    const treeNodes: Record<string, DataNode> = {};

    while (nodes.length > 0) {
        const result = nodes.pop();
        if (result?.node == undefined || result?.childrenSpace == undefined)
            continue;
        const { node, childrenSpace } = result;

        const current = node['<path>'];

        const childParts = new Set(Object.keys(node));
        childParts.delete('<path>');

        // these are paths
        for (const child of childParts) {
            const childNode = {
                key: child,
                title: child,
                children: [],
            };
            childrenSpace.push(childNode);
            nodes.push({
                node: node[child],
                childrenSpace: childNode.children,
                pathNode: childNode,
            });
        }

        let passed = 0;
        let failed = 0;
        let skipped = 0;

        // these are suites
        for (const suiteID of pulled) {
            const suite = parseDetailedTestEntity(
                suites[suiteID],
                started,
                sessions[suites[suiteID].session_id],
            );
            const parent = suites[suiteID].parent;

            if (suite.Status === 'RETRIED' || !suite.File.startsWith(current))
                continue;

            if (suites[suiteID].parent === '') {
                passed += suite.Rate[0];
                failed += suite.Rate[1];
                skipped += suite.Rate[2];
            }

            if (suite.File !== current) continue;

            const treeNode: DataNode = {
                key: suiteID,
                title: (
                    <Space direction="vertical" style={{ marginLeft: '5px' }}>
                        <Space
                            align="baseline"
                            style={{
                                alignItems: 'center',
                            }}
                        >
                            <RenderEntityType entityName={suite.entityName} />
                            <Typography>{suite.Title}</Typography>
                            <Button
                                icon={<ExpandAltOutlined />}
                                shape="circle"
                                onClick={() => {
                                    setTestID(suiteID);
                                }}
                                size="small"
                            />
                        </Space>
                        <Space style={{ marginLeft: '5px' }}>
                            <RenderPassedRate
                                value={suite.Rate}
                                title="Tests"
                            />
                            <Text
                                italic
                            >{`Executed from ${suite.Started[0].format(
                                timeFormatUsed,
                            )} to ${suite.Ended[0].format(
                                timeFormatUsed,
                            )} for ${suite.Duration.humanize()}`}</Text>
                        </Space>
                    </Space>
                ),
                icon: <RenderStatus value={suite.Status} marginTop="6px" />,
                children: [],
            };
            treeNodes[suiteID] = treeNode;
            if (parent.length === 0) childrenSpace.push(treeNode);
            else treeNodes[parent].children?.push(treeNode);

            pulled.delete(suiteID);
        }
        const { pathNode } = result;
        pathNode.title = (
            <Space align="center" style={{ columnGap: '12px' }}>
                <Text>{(pathNode.title as string) ?? ''}</Text>
                <RenderPassedRate
                    value={[passed, failed, skipped]}
                    title="Tests"
                />
            </Space>
        );
    }

    return structure;
}

export default function ProjectStructure(properties: {
    setTestID: (testID: string) => void;
}): ReactNode {
    const { port, testID } = useContext(MetaCallContext);
    const { data: suites } = useSWR<SuiteDetails>(getSuites(port, testID));

    const { data: sessions } = useSWR<SessionDetails>(
        getSessions(port, testID),
    );
    const { data: detailsOfTestRun } = useSWR<TestRunRecord>(
        getTestRun(port, testID),
    );

    const structure = useMemo<specNode>(() => {
        return JSON.parse(detailsOfTestRun?.specStructure ?? '[]');
    }, [detailsOfTestRun]);

    if (
        sessions == undefined ||
        detailsOfTestRun == undefined ||
        suites == undefined
    )
        return <></>;

    const projectStructure = treeData(
        structure,
        suites,
        properties.setTestID,
        dayjs(detailsOfTestRun.started),
        sessions,
    );

    return (
        <DirectoryTree
            treeData={projectStructure}
            showLine
            selectable={false}
            defaultExpandedKeys={projectStructure.map((key) => key.key)} // open the first key
        />
    );
}

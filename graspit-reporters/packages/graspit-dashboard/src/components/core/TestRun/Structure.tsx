import type TestRunRecord from 'src/types/testRunRecords';
import type { SessionDetails, SuiteDetails } from 'src/types/generatedResponse';
import type { specNode } from 'src/types/testRunRecords';
import {
    getSessions,
    getSuites,
    getTestRun,
} from 'src/components/scripts/helper';
import { RenderEntityType, RenderStatus } from 'src/components/utils/renderers';
import RenderPassedRate from 'src/components/charts/StackedBarChart';
import MetaCallContext from '../TestRun/context';

import React, { useContext, type ReactNode } from 'react';
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
import { parseDetailedTestEntity } from 'src/components/parseUtils';

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
    const nodes = [{ node, childrenSpace: root.children }];
    const treeNodes: Record<string, DataNode> = {};

    while (nodes.length > 0) {
        const result = nodes.pop();
        if (result?.node == null || result?.childrenSpace == null) continue;
        const { node, childrenSpace } = result;

        const current = node['<path>'];

        const childParts = new Set(Object.keys(node));
        childParts.delete('<path>');

        // these are paths
        childParts.forEach((child) => {
            const childNode = {
                key: child,
                title: child,
                children: [],
            };
            childrenSpace.push(childNode);
            nodes.push({
                node: node[child],
                childrenSpace: childNode.children,
            });
        });

        // these are suites
        pulled.forEach((suiteID) => {
            const suite = parseDetailedTestEntity(
                suites[suiteID],
                started,
                sessions[suites[suiteID].session_id],
            );
            const parent = suites[suiteID].parent;

            if (suite.Status === 'RETRIED' || suite.File !== current) return;
            const treeNode: DataNode = {
                key: suiteID,
                title: (
                    <Space direction="vertical">
                        <Space
                            align="baseline"
                            style={{ alignItems: 'center' }}
                        >
                            <RenderEntityType entityName={suite.entityName} />
                            <Typography>{suite.Title}</Typography>
                        </Space>
                        <Space>
                            <RenderPassedRate value={suite.Rate} />
                            <Text
                                italic
                            >{`Executed from ${suite.Started[0].format(
                                timeFormatUsed,
                            )} to ${suite.Ended[0].format(
                                timeFormatUsed,
                            )} for ${suite.Duration.humanize()}`}</Text>
                            <Button
                                icon={<ExpandAltOutlined />}
                                shape="circle"
                                onClick={() => {
                                    setTestID(suiteID);
                                }}
                                size="small"
                            />
                        </Space>
                    </Space>
                ),
                icon: <RenderStatus value={suite.Status} />,
                children: [],
            };
            treeNodes[suiteID] = treeNode;
            if (parent.length === 0) childrenSpace.push(treeNode);
            else treeNodes[parent].children?.push(treeNode);

            pulled.delete(suiteID);
        });
    }

    return structure;
}

export default function ProjectStructure(props: {
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
    if (sessions == null || detailsOfTestRun == null || suites == null)
        return <></>;

    const projectStructure: DataNode[] = treeData(
        JSON.parse(detailsOfTestRun.specStructure),
        suites,
        props.setTestID,
        dayjs(detailsOfTestRun.started),
        sessions,
    );

    return (
        <DirectoryTree
            treeData={projectStructure}
            showLine
            selectable={false}
        />
    );
}

import type TestRunRecord from 'src/types/test-run-records';
import type { SuiteDetails } from 'src/types/generated-response';
import type { specNode } from 'src/types/test-run-records';
import { getSuites, getTestRun } from 'src/components/scripts/helper';
import MetaCallContext from './context';
import Dotted from 'src/styles/dotted.module.css';
import React, { useContext, type ReactNode, useMemo } from 'react';
import useSWR from 'swr';
import Space from 'antd/lib/space';
import DirectoryTree from 'antd/lib/tree/DirectoryTree';
import type { DataNode } from 'antd/lib/tree';
import DownOutlined from '@ant-design/icons/DownOutlined';
import Text from 'antd/lib/typography/Text';
import Card from 'antd/lib/card/Card';
import Counter from 'src/components/utils/counter';
import { Tooltip } from 'antd/lib';

function treeData(node: specNode, suites: SuiteDetails): DataNode[] {
    const root: DataNode = { title: 'Root', key: '', children: [] };
    const structure: DataNode[] = [root];
    const pulled = new Set(suites['@order']);
    const nodes = [{ node, childrenSpace: root.children, pathNode: root }];

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
                key: current + child,
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
            const suite = suites[suiteID];

            if (suite.standing === 'RETRIED' || !suite.file.startsWith(current))
                continue;

            if (suites[suiteID].parent === '') {
                passed += suite.rollup_passed ?? 0;
                failed += suite.rollup_failed ?? 0;
                skipped += suite.rollup_skipped ?? 0;
            }

            if (suite.file !== current) continue;

            pulled.delete(suiteID);
        }
        const { pathNode } = result;
        pathNode.title = (
            <Space align="center" style={{ columnGap: '12px' }}>
                <Text>{(pathNode.title as string) ?? ''}</Text>
                <Space>
                    <Tooltip title="Passed">
                        {' '}
                        <Counter
                            end={passed}
                            style={{
                                fontSize: '1.0009rem',
                                textShadow: 'rgba(0,255,77,0.9) 0px 0px 16px',
                            }}
                        />
                    </Tooltip>
                    <Tooltip title="Failed">
                        {' '}
                        <Counter
                            end={failed}
                            style={{
                                fontSize: '1.0009rem',
                                textShadow: 'rgba(255,0,0,0.9) 0px 0px 16px',
                            }}
                        />
                    </Tooltip>
                    <Tooltip title="Skipped">
                        {' '}
                        <Counter
                            end={skipped}
                            style={{
                                fontSize: '1.0009rem',
                                textShadow: 'rgba(255,200,0,0.9) 0px 0px 16px',
                            }}
                        />
                    </Tooltip>
                </Space>
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
    const { data: detailsOfTestRun } = useSWR<TestRunRecord>(
        getTestRun(port, testID),
    );

    const structure = useMemo<specNode>(() => {
        return JSON.parse(detailsOfTestRun?.specStructure ?? '[]');
    }, [detailsOfTestRun]);

    if (detailsOfTestRun == undefined || suites == undefined) return <></>;

    const projectStructure = treeData(structure, suites);

    return (
        <Card type="inner" className={Dotted.dotted}>
            <Space>
                <DirectoryTree
                    treeData={projectStructure}
                    showLine
                    checkable
                    selectable={false}
                    style={{ marginTop: '-15px' }}
                    switcherIcon={
                        <DownOutlined style={{ marginRight: '10px' }} />
                    }
                    defaultExpandedKeys={projectStructure.map((key) => key.key)} // open the first key
                />
            </Space>
        </Card>
    );
}

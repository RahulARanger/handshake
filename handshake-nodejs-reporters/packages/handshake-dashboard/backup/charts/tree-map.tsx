import type { specNode } from 'types/test-run-records';
import React, { Component, type ReactNode } from 'react';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts/core';
import {
    TitleComponent,
    TooltipComponent,
    DatasetComponent,
    GridComponent,
} from 'echarts/components';

import type {
    TitleComponentOption,
    TooltipComponentOption,
    ToolboxComponentOption,
    GridComponentOption,
} from 'echarts/components';

import { TreemapChart } from 'echarts/charts';
import type { ComposeOption } from 'echarts/core';

// Import the Canvas renderer
// Note that including the CanvasRenderer or SVGRenderer is a required step
import { SVGRenderer } from 'echarts/renderers';
import { standingToColors, toolTipFormats } from './constants';
import type { TreemapSeriesOption } from 'echarts/lib/echarts';
import type { StatusContext } from 'types/transfer-structure-context';
import type { SuiteDetails } from 'types/parsed-records';

type composed = ComposeOption<
    | TreemapSeriesOption
    | GridComponentOption
    | TitleComponentOption
    | TooltipComponentOption
    | ToolboxComponentOption
    | GridComponentOption
>;
// Register the required components
echarts.use([
    TitleComponent,
    SVGRenderer,
    TreemapChart,
    GridComponent,
    TooltipComponent,
    DatasetComponent,
]);

export function treeData(
    node: specNode,
    suites: SuiteDetails,
): TreemapSeriesOption['data'] {
    const pulled = new Set(suites['@order']);

    const structure: TreemapSeriesOption['data'] = [];
    type treeNode = (typeof structure)[0];
    const root: treeNode = {
        id: '',
        name: 'Root',
        children: [],
    };

    structure.push(root);

    const nodes: Array<{
        node?: specNode;
        childrenSpace: treeNode['children'];
        pathNode: treeNode;
    }> = [{ node, childrenSpace: root.children, pathNode: root }];

    const suiteNodes: Record<string, treeNode> = {};

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
            const childNode: treeNode = {
                id: current + child,
                name: child,
                children: [],
                color: [standingToColors['PASSED']],
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
            if (suite.Status === 'RETRIED' || !suite.File.startsWith(current))
                continue;
            if (suite.File !== current) continue;

            const parent = suites[suiteID].Parent;

            if (parent === '') {
                passed += suite.RollupValues[0] ?? 0;
                failed += suite.RollupValues[1] ?? 0;
                skipped += suite.RollupValues[2] ?? 0;
            }
            const suiteNode: treeNode = {
                id: suiteID,
                name: suite.Title,
                children: [],
                value: suite.totalRollupValue ?? 0,
                color: [standingToColors[suite.Status]],
            };

            suiteNodes[suiteID] = suiteNode;
            if (parent.length === 0) childrenSpace.push(suiteNode);
            else suiteNodes[parent].children?.push(suiteNode);

            pulled.delete(suiteID);
        }

        const pathNode = result.pathNode as treeNode & { extra: StatusContext };
        pathNode.extra = {
            passed,
            failed,
            skipped,
            title: pathNode.id as string,
            status: 'PASSED',
            isFile: (pathNode?.children?.at(0)?.color?.length ?? 0) > 0,
            isPath: true,
        };
    }

    return structure?.at(0)?.children;
}
export default class TreeMapComponent extends Component<{
    suites: SuiteDetails;
    onClick: (suiteID: string) => void;
    setHovered: (record?: StatusContext) => void;
    data: TreemapSeriesOption['data'];
}> {
    levelOptions: TreemapSeriesOption['levels'] = [
        {
            upperLabel: {
                show: false,
            },
        },
        {
            itemStyle: {
                borderWidth: 9,
                gapWidth: 1,
            },
        },
    ];
    shouldComponentUpdate() // nextProperties: Readonly<{
    //     node: specNode;
    //     suites: SuiteDetails;
    //     onClick: (suiteID: string) => void;
    //     setHovered: (record: SuiteRecordDetails) => void;
    // }>,
    // nextState: Readonly<{}>,
    // nextContext: any,
    : boolean {
        return false; // NOTE: we are not updating the graph as of now
    }

    onMouseOver(parameters: { data: { id: string; extra?: StatusContext } }) {
        const isSuite = this.props.suites[parameters?.data?.id];
        if (!isSuite) return this.props.setHovered(parameters?.data?.extra);
        this.props.setHovered({
            passed: isSuite.RollupValues[0],
            failed: isSuite.RollupValues[1],
            skipped: isSuite.RollupValues[2],
            status: isSuite.Status,
            title: isSuite.Title,
        });
    }

    onDblclick(parameters: { data: { id: string } }) {
        const isSuite = this.props.suites[parameters?.data?.id];
        if (!isSuite) return;
        this.props.onClick(parameters.data.id);
    }

    render(): ReactNode {
        const options: composed = {
            title: { show: false },
            series: [
                {
                    name: 'Structure',
                    type: 'treemap',
                    visibleMin: 300,
                    width: '100%',
                    height: '90%',
                    top: 4,
                    label: {
                        show: true,
                        formatter: '{b}',
                        color: '#ecfaff',
                        textShadowColor: 'white',
                        textShadowOffsetX: 1,
                        textShadowOffsetY: 1,
                        textShadowBlur: 2,
                    },
                    upperLabel: {
                        show: true,
                        height: 30,
                        color: '#e9fff9',
                        fontWeight: 'bold',
                        textShadowColor: 'black',
                        textShadowOffsetX: 1,
                        textShadowOffsetY: 1,
                        textShadowBlur: 2,
                    },
                    itemStyle: {
                        borderColor: '#2e2e2e',
                        borderWidth: 4,
                        borderRadius: 15,
                        borderCap: 'square',
                        gapWidth: 3,
                    },
                    emphasis: {
                        itemStyle: {
                            borderColor: '#141414',
                        },
                    },
                    levels: this.levelOptions,
                    data: this.props.data,
                    breadcrumb: {
                        bottom: -50,
                        left: 5,
                        itemStyle: {
                            borderColor: '#2e2e2e',
                            borderWidth: 1,
                        },
                        emphasis: {
                            itemStyle: {
                                borderColor: 'white',
                                textStyle: {
                                    textShadowColor: 'black',
                                    textShadowOffsetX: 1,
                                    textShadowOffsetY: 1,
                                    textShadowBlur: 2,
                                },
                            },
                        },
                    },
                },
            ],
            tooltip: toolTipFormats,
        };

        return (
            <ReactECharts
                option={options}
                style={{ height: '400px', width: '100%' }}
                onEvents={{
                    mouseover: this.onMouseOver.bind(this),
                    dblclick: this.onDblclick.bind(this),
                }}
            />
        );
    }
}

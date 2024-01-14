import { Badge, Tooltip, type StepProps, type StepsProps } from 'antd/lib';
import type { ErrorRecord } from 'src/types/test-entity-related';
import Space from 'antd/lib/space/index';
import ExpandAltOutlined from '@ant-design/icons/ExpandAltOutlined';
import type { CollapseProps } from 'antd/lib/collapse/Collapse';
import type { TextProps } from 'antd/lib/typography/Text';
import Text from 'antd/lib/typography/Text';
import Button from 'antd/lib/button/button';
import type { Dayjs } from 'dayjs';
import React from 'react';
import { RenderStatus } from 'src/components/utils/renderers';
import type { statusOfEntity } from 'src/types/session-records';
import type { TabsProps } from 'antd/lib/tabs/index';
import EntityItem, {
    ListOfErrors,
    ListOfImages,
    // assertionsTab,
    // descriptionTab,
    errorsTab,
    imagesTab,
} from './entity-item';
import RenderTimeRelativeToStart from 'src/components/utils/relative-time';
import RelativeTo from 'src/components/utils/Datetime/relative-time';
import type {
    ParsedSuiteRecord,
    ParsedTestRecord,
    SuiteDetails,
    TestDetails,
} from 'src/types/parsed-records';

export function extractNeighborSuite(
    suites: SuiteDetails,
    location: number,
    returnPrevious: boolean,
    includeRetried: boolean,
) {
    if (includeRetried)
        return suites[
            suites['@order'][returnPrevious ? location - 1 : location + 1]
        ];

    for (
        let pointTo = returnPrevious ? location - 1 : location + 1;
        returnPrevious ? pointTo >= 0 : pointTo <= suites['@order'].length - 1;
        returnPrevious ? (pointTo -= 1) : (pointTo += 1)
    ) {
        const suite = suites[suites['@order'][pointTo]];
        if (suite?.Status !== 'RETRIED') return suite;
    }
}

export function stepItemsForSuiteTimeline(
    current: string,
    suites: SuiteDetails,
    started: Dayjs,
    ended: Dayjs,
    setTestID: (_: string) => void,
): StepsProps['items'] {
    const currentSuiteRecord = suites[current];
    const here = suites['@order'].indexOf(current);
    if (here === -1) return [];

    const previous = extractNeighborSuite(suites, here, true, false);
    const next = extractNeighborSuite(suites, here, false, false);

    const steps: StepsProps['items'] = [];

    steps.push({
        title: 'Test Started at',
        description: <RelativeTo dateTime={started} autoPlay />,
        status: 'finish',
    });

    previous &&
        steps.push({
            title: (
                <Button
                    type="text"
                    style={{
                        paddingTop: '0px',
                        paddingBottom: '0px',
                        paddingLeft: '3px',
                        paddingRight: '3px',
                        height: '20px',
                    }}
                >
                    {`Prev ${
                        previous?.Status === 'RETRIED' ? 'Retry' : 'Suite'
                    }`}
                </Button>
            ),
            description: (
                <RenderTimeRelativeToStart value={previous.Started} autoPlay />
            ),
            onClick: () => setTestID(previous.Id),
            status: stepStatus(previous.Status),
        });
    steps.push({
        title: <Text>Current Suite</Text>,
        description: (
            <RelativeTo
                dateTime={currentSuiteRecord.Started[0]}
                secondDateTime={currentSuiteRecord.Ended[0]}
                autoPlay
                wrt={started}
                style={{ minWidth: '165px' }}
            />
        ),
        status: stepStatus(currentSuiteRecord.Status),
        style: { minWidth: '210px' },
    });
    next &&
        steps.push({
            title: (
                <Button
                    type="text"
                    style={{
                        paddingTop: '0px',
                        paddingBottom: '0px',
                        paddingLeft: '3px',
                        paddingRight: '3px',
                        height: '20px',
                    }}
                >
                    {`Next ${
                        previous?.Status === 'RETRIED' ? 'Retry' : 'Suite'
                    }`}
                </Button>
            ),
            description: (
                <RelativeTo
                    dateTime={next.Started[0]}
                    autoPlay
                    wrt={next.Started[1]}
                />
            ),
            onClick: () => setTestID(next.Id),
            status: stepStatus(next.Status),
        });

    steps.push({
        title: 'Test Ended at',
        description: (
            <RelativeTo
                dateTime={ended}
                autoPlay
                wrt={currentSuiteRecord.Ended[0]}
            />
        ),
        status: 'finish',
    });

    return steps;
}

export function filterTestsAndSuites(
    suiteID: string,
    suites: SuiteDetails,
    tests: TestDetails,
): Array<ParsedSuiteRecord | ParsedTestRecord> {
    return [
        ...Object.values(tests),
        ...suites['@order'].map((id) => suites[id]),
    ]
        .filter((entity) => {
            const result = entity.Parent === suiteID;
            // result &&= filterStatus == undefined || test.standing === filterStatus;
            // result &&= filterText == undefined || test.title.includes(filterText);
            return result;
        })
        .sort((left, right) =>
            left.Started[0].isBefore(right.Started[0]) ? -1 : 1,
        );
}

export function testStatusText(standing: statusOfEntity): TextProps['type'] {
    switch (standing) {
        case 'PASSED': {
            return 'success';
        }
        case 'FAILED': {
            return 'danger';
        }
        case 'RETRIED':
        case 'SKIPPED': {
            return 'secondary';
        }
        case 'PENDING': {
            return 'warning';
        }
    }
}

export function stepStatus(standing: statusOfEntity): StepProps['status'] {
    switch (standing) {
        case 'PASSED': {
            return 'finish';
        }
        case 'RETRIED':
        case 'FAILED': {
            return 'error';
        }

        case 'SKIPPED': {
            return 'wait';
        }
        case 'PENDING': {
            return 'process';
        }
    }
}

export function attachedTabItems(
    id: string,
    errors: ErrorRecord[],
    setTestID: (_: string) => void,
): TabsProps['items'] {
    return [
        // { key: descriptionTab, label: 'Description' },
        // {
        //     key: assertionsTab,
        //     label: 'Assertions',
        //     // children: <ListOfAssertions assertions={assertionsUsed} />,
        // },
        {
            key: imagesTab,
            label: 'Images',
            children: <ListOfImages entityID={id} />,
        },
        {
            key: errorsTab,
            label: 'Errors',
            children: <ListOfErrors errors={errors} setTestID={setTestID} />,
        },
    ];
}

export function extractDetailedTestEntities(
    source: Array<ParsedSuiteRecord | ParsedTestRecord>,
    testStartedAt: Dayjs,
    setTestID: (_: string) => void,
): CollapseProps['items'] {
    return source.map((test) => {
        const actions = [];
        // const openDetailedView = (tab: string): void => {
        //     setShowDetailedView(true);
        //     setDetailed(parsed.id);
        //     setTabForDetailed(tab);
        // };

        if (test.type === 'SUITE') {
            actions.push(
                <Button
                    key="drill-down"
                    icon={<ExpandAltOutlined />}
                    shape="circle"
                    size="small"
                    onClick={() => {
                        setTestID(test.Id);
                    }}
                />,
            );
        }

        return {
            key: test.Id,
            label: (
                <Space align="center" id={test.Id} style={{ width: '100%' }}>
                    <RenderStatus value={test.Status} />
                    <Text
                        ellipsis={{ tooltip: true }}
                        style={{
                            maxWidth: 460,
                            textDecoration:
                                test.type === 'SUITE' ? 'underline' : undefined,
                            textDecorationThickness: 0.5,
                        }}
                        type={testStatusText(test.Status)}
                    >
                        {test.Title}
                    </Text>
                    {
                        // @ts-expect-error we do not have isBroken for test
                        test.type === 'SUITE' || !test?.isBroken ? (
                            <></>
                        ) : (
                            <Tooltip title="No Assertion under it has failed">
                                <Badge
                                    color="yellow"
                                    count="BROKEN"
                                    title=""
                                    style={{
                                        color: 'black',
                                        fontWeight: 'bold',
                                    }}
                                />
                            </Tooltip>
                        )
                    }
                </Space>
            ),
            children: <EntityItem entity={test} />,
            extra: <Space>{actions}</Space>,
        };
    });
}

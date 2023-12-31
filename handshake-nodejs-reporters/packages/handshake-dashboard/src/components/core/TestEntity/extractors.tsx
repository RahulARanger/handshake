import type { StepProps, StepsProps } from 'antd/lib';
import type {
    AttachmentDetails,
    SuiteDetails,
    TestDetails,
} from 'src/types/generated-response';
import type {
    Attachment,
    SuiteRecordDetails,
} from 'src/types/test-entity-related';
import parseTestEntity, { parseAttachment } from 'src/components/parse-utils';
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
import {
    ListOfAssertions,
    assertionsTab,
    errorsTab,
    imagesTab,
} from './entity-item';
import type { Assertion } from 'src/types/parsed-records';
import RenderTimeRelativeToStart, {
    RenderDuration,
} from 'src/components/utils/relative-time';
import RelativeTo from 'src/components/utils/Datetime/relative-time';
import dayjs from 'dayjs';

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

    const previous = suites[suites['@order'][here - 1]];
    const next = suites[suites['@order'][here + 1]];

    const suiteStarted = dayjs(currentSuiteRecord.started);
    const suiteEnded = dayjs(currentSuiteRecord.ended);

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
                        height: '25px',
                    }}
                >
                    Prev Suite
                </Button>
            ),
            description: (
                <RenderTimeRelativeToStart
                    value={[dayjs(previous.started), started]}
                    autoPlay
                />
            ),
            onClick: () => setTestID(previous.suiteID),
            status: stepStatus(previous.standing),
        });
    steps.push({
        title: 'Current Suite',
        description: (
            <RelativeTo
                dateTime={suiteStarted}
                secondDateTime={suiteEnded}
                autoPlay
                wrt={started}
            />
        ),
        status: stepStatus(currentSuiteRecord.standing),
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
                        height: '25px',
                    }}
                >
                    Next Suite
                </Button>
            ),
            description: (
                <RenderTimeRelativeToStart
                    value={[dayjs(next.started), started]}
                    autoPlay
                />
            ),
            onClick: () => setTestID(next.suiteID),
            status: stepStatus(next.standing),
        });

    steps.push({
        title: 'Test Ended at',
        description: (
            <RenderTimeRelativeToStart value={[ended, suiteStarted]} autoPlay />
        ),
        status: 'finish',
    });

    return steps;
}

export function filterTestsAndSuites(
    suiteID: string,
    suites: SuiteDetails,
    tests: TestDetails,
): SuiteRecordDetails[] {
    return [...Object.values(tests), ...Object.values(suites)].filter(
        (test) => {
            const result = test.parent === suiteID;
            // result &&= filterStatus == undefined || test.standing === filterStatus;
            // result &&= filterText == undefined || test.title.includes(filterText);
            return result;
        },
    );
}

export function extractDetailedTestEntities(
    source: SuiteRecordDetails[],
    testStartedAt: Dayjs,
    setTestID: (_: string) => void,
): CollapseProps['items'] {
    return source.map((test) => {
        const actions = [];
        const parsed = parseTestEntity(test, testStartedAt);
        // const openDetailedView = (tab: string): void => {
        //     setShowDetailedView(true);
        //     setDetailed(parsed.id);
        //     setTabForDetailed(tab);
        // };

        if (test.suiteType === 'SUITE') {
            actions.push(
                <Button
                    key="drill-down"
                    icon={<ExpandAltOutlined />}
                    shape="circle"
                    size="small"
                    onClick={() => {
                        setTestID(test.suiteID);
                    }}
                />,
            );
        }

        return {
            key: test.suiteID,
            label: (
                <Space align="baseline" id={test.suiteID}>
                    <RenderStatus value={test.standing} />
                    {/* <RenderTestType value={test.suiteType} /> */}
                    <Text
                        ellipsis={{ tooltip: true }}
                        style={{
                            width: 460,
                            textDecoration:
                                test.suiteType === 'SUITE'
                                    ? 'underline'
                                    : undefined,
                            textDecorationThickness: 0.5,
                        }}
                        type={testStatusText(test.standing)}
                    >
                        {test.title}
                    </Text>
                </Space>
            ),
            children: <></>,
            extra: <Space>{actions}</Space>,
        };
    });
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
    assertionsUsed: Attachment[],
): TabsProps['items'] {
    return [
        {
            key: assertionsTab,
            label: 'Assertions',
            children: <ListOfAssertions assertions={assertionsUsed} />,
        },
        { key: imagesTab, label: 'Images' },
        { key: errorsTab, label: 'Errors' },
    ];
}

export function extractRollupDependencies(
    suiteID: string,
    tests: TestDetails,
    attachments: AttachmentDetails,
): [Attachment[]] {
    const assertions = [];

    for (const key of Object.keys(tests)) {
        const test = tests[key];
        if (test?.parent !== suiteID) continue;

        assertions.push(
            ...(attachments[test.suiteID]
                ?.filter((item) => item?.type === 'ASSERT')
                ?.map(parseAttachment) ?? []),
        );
    }

    return [assertions];
}

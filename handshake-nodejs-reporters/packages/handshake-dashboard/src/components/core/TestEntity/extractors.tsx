import { Badge, Tooltip, type StepProps, type StepsProps } from 'antd/lib';
import type {
    AttachmentDetails,
    SuiteDetails,
    TestDetails,
} from 'src/types/generated-response';
import type {
    Attachment,
    AttachmentContent,
    SuiteRecordDetails,
} from 'src/types/test-entity-related';
import { parseAttachment } from 'src/components/parse-utils';
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
    ListOfAssertions,
    assertionsTab,
    descriptionTab,
    errorsTab,
    imagesTab,
} from './entity-item';
import RenderTimeRelativeToStart from 'src/components/utils/relative-time';
import RelativeTo from 'src/components/utils/Datetime/relative-time';
import dayjs from 'dayjs';
import type { Assertion } from 'src/types/parsed-records';

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
        if (suite?.standing !== 'RETRIED') return suite;
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
                    {`Prev ${
                        previous?.standing === 'RETRIED' ? 'Retry' : 'Suite'
                    }`}
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
        title: <Text>Current Suite</Text>,
        description: (
            <RelativeTo
                dateTime={suiteStarted}
                secondDateTime={suiteEnded}
                autoPlay
                wrt={started}
                style={{ minWidth: '165px' }}
            />
        ),
        status: stepStatus(currentSuiteRecord.standing),
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
                        height: '25px',
                    }}
                >
                    {`Next ${
                        previous?.standing === 'RETRIED' ? 'Retry' : 'Suite'
                    }`}
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
export function filterTestAttachments(
    referenceTests: TestDetails,
    referenceSuites: SuiteDetails,
    attachments: AttachmentDetails,
    selected: string,
): Attachment[] {
    return Object.values(attachments)
        .flat()
        .filter(
            (attached) =>
                (
                    referenceSuites[attached.entity_id] ??
                    referenceTests[attached.entity_id]
                )?.parent === selected,
        );
}

export function hasFailedAssertion(
    selected: string,
    standing: statusOfEntity,
    attachments: Attachment[],
    parentID?: string,
): false | number {
    return (
        standing === 'FAILED' &&
        attachments.findIndex((attached) => {
            if (
                attached.type !== 'ASSERT' ||
                attached.entity_id !== selected ||
                (parentID && attached.entity_id !== parentID)
            )
                return false;
            const attachment: AttachmentContent = JSON.parse(
                attached.attachmentValue,
            );
            const assertionDetails: Assertion = JSON.parse(attachment.value);
            return !assertionDetails.result.pass;
        })
    );
}

export function extractDetailedTestEntities(
    source: SuiteRecordDetails[],
    testStartedAt: Dayjs,
    setTestID: (_: string) => void,
    testAttachments: Attachment[],
): CollapseProps['items'] {
    let firstTestTime: dayjs.Dayjs;

    return source.map((test) => {
        if (!firstTestTime) firstTestTime = dayjs(test.started);
        const actions = [];
        // const openDetailedView = (tab: string): void => {
        //     setShowDetailedView(true);
        //     setDetailed(parsed.id);
        //     setTabForDetailed(tab);
        // };

        const failedAssertion = hasFailedAssertion(
            test.suiteID,
            test.standing,
            testAttachments,
        );
        const errors = JSON.parse(test.errors);

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
                <Space
                    align="baseline"
                    id={test.suiteID}
                    style={{ width: '100%' }}
                >
                    <RenderStatus value={test.standing} />
                    {test.standing !== 'FAILED' || failedAssertion !== false ? (
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
                    )}
                    <Text
                        ellipsis={{ tooltip: true }}
                        style={{
                            maxWidth: 460,
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
            children: (
                <EntityItem
                    entity={test}
                    started={firstTestTime}
                    links={testAttachments.filter(
                        (attached) =>
                            attached.type === 'LINK' &&
                            attached.entity_id === test.suiteID,
                    )}
                    firstError={errors?.at(0)?.message}
                    totalErrors={errors?.length}
                />
            ),
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
        { key: descriptionTab, label: 'Description' },
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

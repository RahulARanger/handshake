import Space from 'antd/lib/space/index';
import ExpandAltOutlined from '@ant-design/icons/ExpandAltOutlined';
import type { CollapseProps } from 'antd/lib/collapse/Collapse';
import type { TextProps } from 'antd/lib/typography/Text';
import Button from 'antd/lib/button/button';
import type { Dayjs } from 'dayjs';
import React from 'react';
import { RenderTestItem } from 'src/components/utils/renderers';
import type { statusOfEntity } from 'src/types/session-records';
import EntityItem from './entity-item';
import type {
    ParsedSuiteRecord,
    ParsedTestRecord,
    SuiteDetails,
    TestDetails,
} from 'src/types/parsed-records';

export function extractNeighborSuite(
    suites: SuiteDetails,
    location: number,
    returnPrevious?: boolean,
    includeRetried?: boolean,
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

export function extractDetailedTestEntities(
    source: Array<ParsedSuiteRecord | ParsedTestRecord>,
    setTestID: (_: string) => void,
    testStartedAt: Dayjs,
): CollapseProps['items'] {
    return source.map((test) => {
        const actions = [];

        if (test.type === 'SUITE') {
            actions.push(
                <Button
                    key="drill-down"
                    icon={<ExpandAltOutlined />}
                    shape="circle"
                    size="small"
                    style={{ backgroundColor: 'transparent' }}
                    onClick={() => {
                        setTestID(test.Id);
                    }}
                />,
            );
        }

        return {
            key: test.Id,
            label: (
                <RenderTestItem record={test} layoutStyle={{ width: '100%' }} />
            ),
            id: test.Id,
            children: (
                <EntityItem
                    entity={test}
                    setTestID={setTestID}
                    testStartedAt={testStartedAt}
                />
            ),
            extra: <Space>{actions}</Space>,
        };
    });
}

import {
    type BreadcrumbSeparatorType,
    type BreadcrumbItemType,
} from 'antd/lib/breadcrumb/Breadcrumb';
import { TEXT } from 'handshake-utils';
import Text from 'antd/lib/typography/Text';
import React from 'react';
import Title from 'antd/lib/typography/Title';

export type crumbItems = Array<
    Partial<BreadcrumbItemType & BreadcrumbSeparatorType>
>;

export function ApplicationName(properties: { largeSize?: boolean }) {
    if (!properties.largeSize)
        return <Text id="appName">{TEXT.applicationName}</Text>;
    return (
        <Title id="appName" level={4}>
            {TEXT.applicationName}
        </Title>
    );
}

export default function crumbs(
    allowHref?: boolean,
    length?: number,
): crumbItems {
    return [
        {
            title: <ApplicationName />,
        },
        {
            title: (
                <Text id="runs-route">
                    {length == undefined ? 'Runs' : `Runs (${length})`}
                </Text>
            ),
            href: allowHref == undefined ? undefined : '/RUNS/',
        },
    ];
}

export function crumbsForRun(projectName: string): crumbItems {
    const previousItems = crumbs(true);
    previousItems.push({ title: <Text id="projectName">{projectName}</Text> });
    return previousItems;
}

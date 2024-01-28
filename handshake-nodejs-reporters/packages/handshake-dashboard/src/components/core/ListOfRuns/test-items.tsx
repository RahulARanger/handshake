import {
    type BreadcrumbSeparatorType,
    type BreadcrumbItemType,
} from 'antd/lib/breadcrumb/Breadcrumb';
import { TEXT } from 'handshake-utils';
import Text from 'antd/lib/typography/Text';
import React from 'react';

export type crumbItems = Array<
    Partial<BreadcrumbItemType & BreadcrumbSeparatorType>
>;

export default function crumbs(
    allowHref?: boolean,
    length?: number,
): crumbItems {
    return [
        {
            title: <Text id="appName">{TEXT.applicationName}</Text>,
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

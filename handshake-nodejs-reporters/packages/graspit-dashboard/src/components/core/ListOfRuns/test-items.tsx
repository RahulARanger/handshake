import {
    type BreadcrumbSeparatorType,
    type BreadcrumbItemType,
} from 'antd/lib/breadcrumb/Breadcrumb';

export type crumbItems = Array<
    Partial<BreadcrumbItemType & BreadcrumbSeparatorType>
>;

export default function crumbs(
    allowHref?: boolean,
    length?: number,
): crumbItems {
    return [
        {
            title: 'Graspit',
        },
        {
            title: length == undefined ? 'Runs' : `Runs (${length})`,
            href: allowHref == undefined ? undefined : '/RUNS/',
        },
    ];
}

export function crumbsForRun(projectName: string): crumbItems {
    const previousItems = crumbs(true);
    previousItems.push({ title: projectName });
    return previousItems;
}

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
            title: length == null ? 'Runs' : `Runs (${length})`,
            href: allowHref != null ? '/RUNS/' : undefined,
        },
    ];
}

export function crumbsForRun(projectName: string): crumbItems {
    const prevItems = crumbs(true);
    prevItems.push({ title: projectName });
    return prevItems;
}

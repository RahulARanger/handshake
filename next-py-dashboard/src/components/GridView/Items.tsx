import {
    type BreadcrumbSeparatorType,
    type BreadcrumbItemType,
} from "antd/lib/breadcrumb/Breadcrumb";

type crumbItems = Array<Partial<BreadcrumbItemType & BreadcrumbSeparatorType>>;

export default function crumbs(allowHref?: boolean): crumbItems {
    return [
        {
            title: "Next-Py",
        },
        {
            title: "Runs",
            href: allowHref != null ? "/RUNS/" : undefined,
        },
    ];
}

export function crumbsForRun(projectName: string): crumbItems {
    const prevItems = crumbs(true);
    prevItems.push({ title: projectName });
    return prevItems;
}

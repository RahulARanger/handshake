import {
    type BreadcrumbSeparatorType,
    type BreadcrumbItemType,
} from "antd/lib/breadcrumb/Breadcrumb";

export default function crumbs(): Array<
    Partial<BreadcrumbItemType & BreadcrumbSeparatorType>
> {
    return [
        {
            title: "Next-Py",
        },
        {
            title: "Runs",
            // href: "/RUNS/",
        },
    ];
}

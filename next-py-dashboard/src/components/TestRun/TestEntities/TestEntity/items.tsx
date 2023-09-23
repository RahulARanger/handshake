import { type SuiteDetails } from "@/types/detailedTestRunPage";
import { type crumbItems } from "@/components/ListOfRuns/Items";
import Button from "antd/lib/button/button";
import React from "react";

export default function parentEntities(
    suites: SuiteDetails,
    current: string,
    setTestID: (testID: string) => void
): crumbItems {
    const parents: crumbItems = [];
    let selected = current;

    while (selected != null && selected !== "") {
        const suite = suites[selected];
        parents.push({
            title: (
                <Button type="text" size="small">
                    {suite.title}
                </Button>
            ),
            onClick: () => {
                setTestID(suite.suiteID);
            },
        });
        selected = suite.parent;
    }

    return parents.reverse();
}

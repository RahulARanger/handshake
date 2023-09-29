import Badge from "antd/lib/badge/index";
import { type suiteType } from "@/types/detailedTestRunPage";
import React, { type ReactNode } from "react";

export default function BadgeForSuiteType(props: {
    suiteType: suiteType;
}): ReactNode {
    return (
        <Badge
            color={props.suiteType === "SUITE" ? "purple" : "magenta"}
            count={props.suiteType}
            style={{ fontWeight: "bold", color: "white" }}
        />
    );
}

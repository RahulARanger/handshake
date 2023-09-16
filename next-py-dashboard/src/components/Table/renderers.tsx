import { type Dayjs } from "dayjs";
import React, { type ReactNode } from "react";
import RelativeTime, { HumanizeDuration } from "../Datetime/relativeTime";
import { type Duration } from "dayjs/plugin/duration";
import CheckIcon from "@mui/icons-material/Check";
import ErrorIcon from "@mui/icons-material/Error";
import PendingIcon from "@mui/icons-material/Pending";
import { type statusOfEntity } from "@/types/detailedTestRunPage";
import TurnSlightLeftIcon from "@mui/icons-material/TurnSlightLeft";
import { type AlertColor } from "@mui/material";

export default function RenderTimeRelativeToStart(props: {
    value?: [Dayjs, Dayjs];
}): ReactNode {
    if (props.value == null) return <></>;
    return <RelativeTime dateTime={props.value[0]} wrt={props.value[1]} />;
}

export function RenderDuration(props: { value: Duration }): ReactNode {
    return <HumanizeDuration duration={props.value} />;
}

export function RenderStatus(props: { value: statusOfEntity }): ReactNode {
    switch (props.value) {
        case "PASSED": {
            return <CheckIcon color="success" titleAccess="Passed" />;
        }
        case "FAILED": {
            return <ErrorIcon color="error" titleAccess="Failed" />;
        }
        case "PENDING": {
            return <PendingIcon color="warning" titleAccess="Pending" />;
        }
        case "SKIPPED": {
            return <TurnSlightLeftIcon color="warning" titleAccess="Skipped" />;
        }
    }
}

export function fetchAlertStatus(status: statusOfEntity): AlertColor {
    switch (status) {
        case "FAILED":
            return "error";
        case "PASSED":
            return "success";
        case "SKIPPED":
            return "info";
        case "PENDING":
            return "warning";
    }
}

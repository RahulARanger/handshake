import { type Dayjs } from "dayjs";
import React, { type ReactNode } from "react";
import Tooltip from "@mui/material/Tooltip";
import { formatDateTime } from "../parseUtils";
import RelativeTime from "../Datetime/relativeTime";

export default function RenderTimeRelativeToStart(props: {
    value: [Dayjs, Dayjs];
}): ReactNode {
    return <RelativeTime dateTime={props.value[0]} wrt={props.value[1]} />;
}

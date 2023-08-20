import { Dayjs } from "dayjs";
import React from "react";
import Tooltip from "@mui/material/Tooltip"
import { formatDateTime } from "../parseUtils";

export default function RenderTimeRelativeToStart(params: {value: [string, Dayjs]}){
    return (
        <Tooltip title={formatDateTime(params.value[1])}>
            <span className="my-renderer">
            {params.value[0]}
        </span>
        </Tooltip>
    );
}
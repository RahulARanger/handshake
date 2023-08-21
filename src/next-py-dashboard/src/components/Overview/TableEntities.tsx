import React, { type ReactNode } from "react";
import { AgGridReact } from "ag-grid-react";
import useSWRImmutable from "swr/immutable";
import Skeleton from "@mui/material/Skeleton";
import { type SuiteDetails } from "@/types/detailedTestRunPage";
import parseTestEntity from "../parseUtils";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import { type ColDef } from "ag-grid-community";
import RenderTimeRelativeToStart from "./renderers";
import type DetailsOfRun from "@/types/testRun";
import dayjs from "dayjs";

export function ImportantThings(): ReactNode {
    const columnDefs = [
        { field: "Title" },
        { field: "Started" },
        { field: "Ended" },
        { field: "Status" },
    ];
    return <></>;
}

export default function TestEntities(props: {
    getSuites: string;
    getTestRun: string;
}): ReactNode {
    const { data } = useSWRImmutable<SuiteDetails[]>(props.getSuites);
    const { data: testRun } = useSWRImmutable<DetailsOfRun>(props.getTestRun);
    if (data == null || testRun == null)
        return <Skeleton width={200} height={150} />;
    const testStartedAt = dayjs(testRun.started);
    const sliced = data
        .slice(-10, data.length)
        .reverse()
        .map((testDate) => parseTestEntity(testDate, testStartedAt));

    const columnDefs: ColDef[] = [
        { field: "Title", resizable: true },
        { field: "Started", cellRenderer: RenderTimeRelativeToStart },
        { field: "Ended", cellRenderer: RenderTimeRelativeToStart },
        { field: "Status" },
    ];
    return (
        <div
            className="ag-theme-alpine-dark"
            style={{ height: 270, width: 550 }}
        >
            <AgGridReact rowData={sliced} columnDefs={columnDefs}></AgGridReact>
        </div>
    );
}

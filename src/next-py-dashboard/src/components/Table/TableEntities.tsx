import React, { type ReactNode } from "react";
import { AgGridReact } from "ag-grid-react";
import useSWRImmutable from "swr/immutable";
import Skeleton from "@mui/material/Skeleton";
import { type SuiteDetails } from "@/types/detailedTestRunPage";
import parseTestEntity from "../parseUtils";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import { type ColDef } from "ag-grid-community";
import RenderTimeRelativeToStart, {
    RenderDuration,
    RenderPassedRate,
    RenderStatus,
} from "./renderers";
import type DetailsOfRun from "@/types/testRun";
import dayjs from "dayjs";
import tableCellStyles from "@/styles/table.module.css";

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
        .map((testDate: SuiteDetails) =>
            parseTestEntity(testDate, testStartedAt)
        );

    const columnDefs: ColDef[] = [
        {
            field: "Status",
            cellRenderer: RenderStatus,
            cellClass: tableCellStyles.centerRenderedCell,
            width: 75,
            pinned: true,
        },
        { field: "Title", resizable: true },
        {
            field: "Duration",
            cellRenderer: RenderDuration,
            width: 120,
            cellClass: tableCellStyles.centerRenderedCell,
        },
        {
            field: "Rate",
            cellRenderer: RenderPassedRate,
            width: 100,
            cellClass: tableCellStyles.centerRenderedCell,
            cellStyle: { alignItems: "flex-end" },
        },
        { field: "Tests", width: 70 },
        {
            field: "Started",
            cellRenderer: RenderTimeRelativeToStart,
            width: 170,
            cellClass: tableCellStyles.centerRenderedCell,
        },
        {
            field: "Ended",
            cellRenderer: RenderTimeRelativeToStart,
            width: 170,
            cellClass: tableCellStyles.centerRenderedCell,
        },
    ];
    return (
        <div className="ag-theme-alpine-dark" style={{ height: 270 }}>
            <AgGridReact rowData={sliced} columnDefs={columnDefs}></AgGridReact>
        </div>
    );
}

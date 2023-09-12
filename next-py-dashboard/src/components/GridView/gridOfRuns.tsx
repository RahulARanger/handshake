import type DetailsOfRun from "@/types/testRun";
import React, { type ReactNode } from "react";
import { registerAllModules } from "handsontable/registry";
import { HotColumn, HotTable } from "@handsontable/react";
import "handsontable/dist/handsontable.full.min.css";
import handsometable from "@/styles/handsome.module.css";
import { parseDetailedTestRun } from "../parseUtils";
import RenderTimeRelativeToStart, {
    RenderDuration,
    RenderStatus,
} from "../Table/renderers";
import { RenderPassedRate } from "../Table/stackedBarChart";

registerAllModules();

export default function GridOfRuns(props: { runs: DetailsOfRun[] }): ReactNode {
    return (
        <HotTable
            data={props.runs.map(parseDetailedTestRun)}
            licenseKey="non-commercial-and-evaluation"
            settings={{ filters: true }}
            height={"auto"}
            width={"100%"}
            readOnly={true}
            fixedColumnsStart={1}
            contextMenu={true}
            rowHeights={45}
            dropdownMenu={true}
            tableClassName={handsometable.handsontableClass}
            style={{
                transition: "all 0.5s ease",
            }}
        >
            <HotColumn data={"Status"} title="Status">
                <RenderStatus hot-renderer />
            </HotColumn>
            <HotColumn data={"Started"} title="Started" width={100}>
                <RenderTimeRelativeToStart hot-renderer />
            </HotColumn>
            <HotColumn
                data={"Title"}
                title="Title"
                manualColumnResize={true}
                manualColumnFreeze={true}
            />
            {/* <HotColumn data={"Duration"} title="Duration" width={100}>
                <RenderDuration hot-renderer />
            </HotColumn> */}
            <HotColumn data={"Rate"} title="Rate" width={150}>
                <RenderPassedRate hot-renderer />
            </HotColumn>
            <HotColumn data={"SuitesSummary"} title="SuitesSummary" width={150}>
                <RenderPassedRate hot-renderer />
            </HotColumn>
            <HotColumn data={"Tests"} title="Tests" type="numeric" />
            <HotColumn data={"Suites"} title="Suites" type="numeric" />

            {/* <HotColumn data={"Ended"} title="Ended" width={100}>
                <RenderTimeRelativeToStart hot-renderer />
            </HotColumn> */}
            {/* <HotColumn data={"File"} title="File" />
            <HotColumn
                data={"Description"}
                title="Description"
                width={150}
                wordWrap={true}
                autoWrapRow={true}
            /> */}
        </HotTable>
    );
}

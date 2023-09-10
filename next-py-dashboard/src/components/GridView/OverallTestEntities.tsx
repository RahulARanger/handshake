import { getSuites, getTestRun } from "@/Generators/helper";
import { type SuiteDetails } from "@/types/detailedTestRunPage";
import React, { type ReactNode } from "react";
import Skeleton from "@mui/material/Skeleton";
import useSWR from "swr";
import RenderTimeRelativeToStart, {
    RenderDuration,
    RenderStatus,
} from "@/components/Table/renderers";
import { RenderPassedRate } from "@/components/Table/stackedBarChart";
import {
    type PreviewForDetailedEntities,
    parseDetailedTestEntity,
} from "../parseUtils";
import type DetailsOfRun from "@/types/testRun";
import dayjs from "dayjs";
import { registerAllModules } from "handsontable/registry";
import { HotColumn, HotTable } from "@handsontable/react";
import "handsontable/dist/handsontable.full.min.css";

registerAllModules();

export default function OverAllTestEntities(props: {
    port: string;
    test_id: string;
}): ReactNode {
    const { data: suites } = useSWR<SuiteDetails>(
        getSuites(props.port, props.test_id)
    );
    const { data: testRun } = useSWR<DetailsOfRun>(
        getTestRun(props.port, props.test_id)
    );

    if (testRun == null || suites == null)
        return <Skeleton width={200} height={200} />;

    const parsed: PreviewForDetailedEntities[] = [];
    const started = dayjs(testRun.started);

    suites["@order"].forEach((suiteID: string) => {
        parsed.push(parseDetailedTestEntity(suites[suiteID], started));
    });

    return (
        <HotTable
            data={parsed}
            licenseKey="non-commercial-and-evaluation"
            settings={{ filters: true }}
            height={"auto"}
            width={"100%"}
            readOnly={true}
            fixedColumnsStart={1}
            contextMenu={true}
            rowHeights={45}
            dropdownMenu={true}
        >
            <HotColumn data={"Status"} title="Status">
                <RenderStatus hot-renderer />
            </HotColumn>
            <HotColumn
                data={"Title"}
                title="Title"
                manualColumnResize={true}
                manualColumnFreeze={true}
            />
            <HotColumn data={"Duration"} title="Duration" width={100}>
                <RenderDuration hot-renderer />
            </HotColumn>
            <HotColumn data={"Rate"} title="Rate" width={150}>
                <RenderPassedRate hot-renderer />
            </HotColumn>
            <HotColumn data={"Tests"} title="Tests" type="numeric" />
            <HotColumn data={"Retried"} title="Retried" />
            <HotColumn data={"Started"} title="Started" width={100}>
                <RenderTimeRelativeToStart hot-renderer />
            </HotColumn>
            <HotColumn data={"Ended"} title="Ended" width={100}>
                <RenderTimeRelativeToStart hot-renderer />
            </HotColumn>
            <HotColumn data={"File"} title="File" />
            <HotColumn
                data={"Description"}
                title="Description"
                width={150}
                wordWrap={true}
                autoWrapRow={true}
            />
        </HotTable>
    );
}

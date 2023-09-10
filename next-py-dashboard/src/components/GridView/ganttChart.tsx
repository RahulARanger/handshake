import React, { type ReactNode } from "react";
import { getSuites, getTestRun } from "@/Generators/helper";
import { type SuiteDetails } from "@/types/detailedTestRunPage";
import type DetailsOfRun from "@/types/testRun";
import useSWR from "swr";
import HighchartsReact from "highcharts-react-official";
import HighChartsAccessibility from "highcharts/modules/accessibility";
import HighChartsForGantt from "highcharts/highcharts-gantt";
import HighchartsGantt from "highcharts/modules/gantt";

import dayjs from "dayjs";
import "@/styles/highChartExternal.module.css";

if (typeof HighChartsForGantt === "object") {
    HighchartsGantt(HighChartsForGantt);
    HighChartsAccessibility(HighChartsForGantt);
}

export default function GanttChart(props: {
    port: string;
    test_id: string;
}): ReactNode {
    const { data: suites } = useSWR<SuiteDetails>(
        getSuites(props.port, props.test_id)
    );
    const { data: testRun } = useSWR<DetailsOfRun>(
        getTestRun(props.port, props.test_id)
    );

    if (testRun == null || suites == null) {
        return <></>;
    }
    const started = dayjs(testRun.started);
    const ended = dayjs(testRun.ended);

    const data: HighChartsForGantt.GanttPointOptionsObject[] = suites[
        "@order"
    ].map((suiteID) => {
        return {
            name: suites[suiteID].title,
            description: suites[suiteID].description,
            parent: suites[suiteID].parent,
            id: suiteID,
            start: dayjs(suites[suiteID].started).valueOf(),
            end: dayjs(suites[suiteID].ended).valueOf(),
        };
    });

    // THE CHART
    const options: Highcharts.Options = {
        chart: {
            type: "gantt",
            plotShadow: true,
            className: "highcharts-dark",
        },
        credits: { enabled: false },
        title: {
            text: `${testRun.projectName}::Gantt Chart`,
        },
        subtitle: {
            text: "Plotted with your Suite",
        },
        xAxis: {
            // min: started.subtract(21, "minutes").valueOf(),
            // max: ended.add(2, "hour").valueOf(),
        },
        accessibility: {
            keyboardNavigation: {
                seriesNavigation: {
                    mode: "serialize",
                },
            },
            point: {
                descriptionFormat:
                    "{yCategory}. Start {x:%Y-%m-%d}, end {x2:%Y-%m-%d}.",
            },
        },
        series: [
            {
                type: "gantt",
                name: testRun.projectName,
                data,
            },
        ],
    };

    return (
        <HighchartsReact
            highcharts={HighChartsForGantt}
            options={options}
            constructorType="ganttChart"
        />
    );
}

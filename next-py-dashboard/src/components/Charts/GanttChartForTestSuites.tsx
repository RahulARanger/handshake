import React, { useContext, type ReactNode } from "react";
import { getSuites, getTestRun } from "@/Generators/helper";
import { type SuiteDetails } from "@/types/detailedTestRunPage";
import type DetailsOfRun from "@/types/testRun";
import useSWR from "swr";
import HighchartsReact from "highcharts-react-official";
import HighChartsAccessibility from "highcharts/modules/accessibility";
import HighChartsForGantt from "highcharts/highcharts-gantt";
import HighchartsGantt from "highcharts/modules/gantt";
import brandDark from "highcharts/themes/brand-dark";

import dayjs from "dayjs";
import "@/styles/highChartExternal.module.css";
import MetaCallContext from "../TestRun/context";

if (typeof HighChartsForGantt === "object") {
    HighchartsGantt(HighChartsForGantt);
    brandDark(HighChartsForGantt);
    HighChartsAccessibility(HighChartsForGantt);
}

export default function GanttChartForTestEntities(): ReactNode {
    const { port, testID } = useContext(MetaCallContext);
    const { data: suites } = useSWR<SuiteDetails>(getSuites(port, testID));
    const { data: testRun } = useSWR<DetailsOfRun>(getTestRun(port, testID));

    if (testRun == null || suites == null) {
        return <></>;
    }

    const data: HighChartsForGantt.GanttPointOptionsObject[] = suites[
        "@order"
    ].map((suiteID, index) => {
        let dependentOn;

        if (index > 0) {
            const previous = suites[suites["@order"][index - 1]];
            if (
                suites[suiteID].parent !== "" &&
                previous.parent === suites[suiteID].parent
            )
                dependentOn = previous.suiteID;
        }

        return {
            name: suites[suiteID].title,
            description: suites[suiteID].description,
            parent: suites[suiteID].parent,
            id: suiteID,
            start: dayjs(suites[suiteID].started).valueOf(),
            end: dayjs(suites[suiteID].ended).valueOf(),
            dependency: dependentOn ?? suites[suiteID].parent,
        };
    });

    // THE CHART
    const options: Highcharts.Options = {
        chart: {
            type: "gantt",
            plotShadow: true,
            className: "highcharts-dark",
            backgroundColor: "#141414",
            style: {
                padding: "9px",
            },
        },
        credits: { enabled: false },
        title: {
            text: `${testRun.projectName}::Gantt Chart`,
            align: "left",
            style: {
                fontSize: "1.35rem",
            },
        },
        subtitle: {
            text: "<small>Please find your suites here</small>",
            align: "left",
            style: {
                fontSize: ".89rem",
            },
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
        navigator: {
            enabled: true,
            series: {
                type: "gantt",
                pointPadding: 0.25,
                accessibility: {
                    enabled: false,
                },
            },
            yAxis: {
                min: 0,
                max: 3,
                reversed: true,
                categories: [],
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

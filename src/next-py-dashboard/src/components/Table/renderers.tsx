import { type Dayjs } from "dayjs";
import React, { type ReactNode } from "react";
import RelativeTime, { HumanizeDuration } from "../Datetime/relativeTime";
import { type Duration } from "dayjs/plugin/duration";
import CheckIcon from "@mui/icons-material/Check";
import ErrorIcon from "@mui/icons-material/Error";
import PendingIcon from "@mui/icons-material/Pending";
import { type statusOfEntity } from "@/types/detailedTestRunPage";
import TurnSlightLeftIcon from "@mui/icons-material/TurnSlightLeft";
import { Bar } from "react-chartjs-2";
import {
    Chart as ChartJS,
    type ChartData,
    type ChartOptions,
    CategoryScale,
    LinearScale,
    BarElement,
} from "chart.js";
import { statusColors } from "../parseUtils";

ChartJS.register(CategoryScale, LinearScale, BarElement);

export default function RenderTimeRelativeToStart(props: {
    value: [Dayjs, Dayjs];
}): ReactNode {
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

export function RenderPassedRate(props: {
    value: [number, number, number];
}): ReactNode {
    const [passed, failed, skipped] = props.value;
    const labels = ["Passed", "Failed", "Skipped"];
    const data: ChartData<"bar"> = {
        labels,
        datasets: [
            {
                label: labels[0],
                data: [passed],
                backgroundColor: statusColors.passed,
                borderWidth: 2,
            },
            {
                label: labels[1],
                data: [failed],
                backgroundColor: statusColors.failed,
                borderWidth: 2,
            },
            {
                label: labels[2],
                data: [skipped],
                backgroundColor: statusColors.skipped,
                borderWidth: 2,
            },
        ],
    };

    const options: ChartOptions<"bar"> = {
        indexAxis: "y",
        plugins: {
            title: {
                display: false,
            },
            legend: { display: false },
            tooltip: { enabled: false },
        },
        responsive: true,
        scales: {
            x: {
                stacked: true,
                display: false,
            },
            y: {
                stacked: true,
                display: false,
            },
        },
    };

    return <Bar options={options} data={data} height={120} />;
}

import React, { type ReactNode } from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Label,
    ResponsiveContainer,
} from "recharts";

export default function TestResultRenderer(props: {
    value: [number, number, number];
}): ReactNode {
    const data = {
        passed: props.value[0],
        failed: props.value[1],
        skipped: props.value[2],
    };
    const total = data.passed + data.failed + data.skipped;

    return (
        <ResponsiveContainer width={"100%"}>
            <BarChart layout="vertical" data={[data]}>
                <XAxis hide type="number" />
                <YAxis dataKey="name" type="category" tick={false}>
                    <Label
                        value={`${((props.value[0] / total) * 1e2).toFixed(
                            2
                        )}%`}
                        offset={-46}
                        color="white"
                        position="left"
                    />
                </YAxis>
                <Bar dataKey="passed" stackId="a" fill="green" />
                <Bar dataKey="failed" stackId="a" fill="red" />
                <Bar dataKey="skipped" stackId="a" fill="grey" />
            </BarChart>
        </ResponsiveContainer>
    );
}

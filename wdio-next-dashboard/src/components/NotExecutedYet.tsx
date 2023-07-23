"use client";

import { Paper, Stack, Typography, Skeleton } from "@mui/material";
import Divider from "@mui/material/Divider";
import React, {
    useState,
    type ReactNode,
    useCallback,
    type ReactElement,
} from "react";

import { PieChart, Pie, Cell, Sector, type PieProps } from "recharts";
import Grid from "@mui/material/Unstable_Grid2";
import { type ExtraPieProps } from "./pieCharts";

interface EmptyStateProps {
    error?: string;
    isLoading: boolean;
}

function renderActiveShape(
    props: PieProps & ExtraPieProps
): ReactElement<SVGElement> {
    return (
        <g>
            <Sector
                cx={props.cx}
                cy={props.cy}
                innerRadius={props.innerRadius}
                outerRadius={props.outerRadius}
                startAngle={props.startAngle}
                endAngle={props.endAngle}
                fill={props.fill}
                strokeWidth={1}
                stroke={"#fff"}
            />
        </g>
    );
}

function SkeletonPage(): ReactNode {
    return (
        <Stack
            display="flex"
            flexDirection="column"
            sx={{
                height: "100%",
                width: "100%",
                flexGrow: 1,
                p: "10px",
            }}
        >
            <Stack display="flex" flexDirection="row" gap={"20px"}>
                <Skeleton
                    animation={"pulse"}
                    width={60}
                    height={60}
                    variant="circular"
                />
                <Skeleton animation={"pulse"} width={"90vw"} height={60} />
            </Stack>
            <Divider sx={{ mt: "10px" }} />
            <Stack display="flex" flexDirection="row" gap="20px">
                <Grid
                    container
                    gap={6}
                    columns={3.3}
                    sm={2}
                    justifyContent={"center"}
                    sx={{
                        flexGrow: "1 !important",
                    }}
                >
                    <Grid xs={1}>
                        <Skeleton animation={"wave"} height={300} />
                    </Grid>
                    <Grid xs={1}>
                        <Skeleton animation={"wave"} height={300} />
                    </Grid>
                    <Grid xs={1}>
                        <Skeleton animation={"wave"} height={300} />
                    </Grid>
                    <Grid xs={3}>
                        <Skeleton animation={"wave"} variant="text" />
                    </Grid>
                    <Grid xs={3}>
                        <Skeleton animation={"wave"} variant="text" />
                    </Grid>
                    <Grid xs={3}>
                        <Skeleton animation={"wave"} variant="text" />
                    </Grid>
                </Grid>
                <Divider orientation="vertical" />
                <Stack
                    display="flex"
                    flexDirection="column"
                    gap={"20px"}
                    alignItems={"flex-start"}
                >
                    <Skeleton
                        animation={"wave"}
                        height={"150px"}
                        width={"30px"}
                    />
                    <Skeleton
                        animation={"wave"}
                        height={"150px"}
                        width={"30px"}
                    />
                    <Skeleton
                        animation={"wave"}
                        height={"150px"}
                        width={"30px"}
                    />
                </Stack>
            </Stack>
        </Stack>
    );
}

export default function EmptyState(props: EmptyStateProps): ReactNode {
    const [activeIndex, setActiveIndex] = useState<number>(
        (props?.error?.length ?? 0) > 0 ? 0 : 1
    );
    const onMouseHover = useCallback(
        (_: unknown, index: number) => {
            setActiveIndex(index);
        },
        [setActiveIndex]
    );

    const COLORS = ["#0088FE", "#FF8042", "#FFBB28"];
    const myError = (props.error?.length ?? 0) > 0 ? 60 : 20;
    const reasons = [
        {
            name: "Not Started yet",
            value: (100 - myError) / 2,
            description: (
                <Typography variant="subtitle2" key={0}>
                    Please wait until files are generated
                </Typography>
            ),
        },
        {
            name: "File not generated",
            value: (100 - myError) / 2,
            description: (
                <Typography variant="subtitle2" key={1}>
                    Files are not generated yet, so please wait for them
                </Typography>
            ),
        },
        {
            name: "Internal Error",
            value: myError,
            description: (
                <Typography variant="subtitle2" key={2}>
                    Internal Script errors, please report this{" "}
                    <a href="">here</a> if you feel it so.
                </Typography>
            ),
        },
    ];
    const noResults = (
        <Stack
            sx={{ flexGrow: 1, height: "100%" }}
            alignItems="center"
            justifyContent={"center"}
        >
            <Paper sx={{ p: "12px" }}>
                <Typography variant="h6" sx={{ textAlign: "center" }}>
                    No Test suites found
                </Typography>
                <Divider />
                <PieChart width={300} height={200}>
                    <Pie
                        activeIndex={activeIndex}
                        activeShape={renderActiveShape}
                        dataKey={"value"}
                        data={reasons}
                        nameKey={"name"}
                        innerRadius={40}
                        outerRadius={80}
                        paddingAngle={6}
                        startAngle={180}
                        strokeWidth={0.5}
                        endAngle={0}
                        onMouseEnter={onMouseHover}
                    >
                        {reasons.map((entry, index) => (
                            <Cell
                                key={`cell-${entry.name}`}
                                fill={COLORS[index]}
                            />
                        ))}
                    </Pie>
                </PieChart>
            </Paper>
        </Stack>
    );

    return props.isLoading ? <SkeletonPage /> : noResults;
}

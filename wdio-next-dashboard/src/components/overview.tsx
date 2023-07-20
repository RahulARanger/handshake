import React, { useState, type ReactNode, useCallback } from "react";
import { AskTestResult } from "./askThings";
import {
    Paper,
    Skeleton,
    Stack,
    Typography,
    Tooltip,
    Divider,
    Switch,
} from "@mui/material";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { type FeatureResult } from "@/types/appConfig";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableFooter from "@mui/material/TableFooter";
import TablePagination from "@mui/material/TablePagination";
import readDateForKey, { fromNow } from "./helper";
import GraphCard from "./graphCard";
import renderActiveShape from "./pieCharts";
import { schemeSet2 } from "d3-scale-chromatic";
import type dayjs from "dayjs";
import StyledTableCell, { StyledTableRow } from "./tableThings";
import Grid from "@mui/material/Unstable_Grid2/Grid2";

function ProgressPieChart(props: {
    passed: number;
    failed: number;
    skipped: number;
    startDate: dayjs.Dayjs;
}): ReactNode {
    const [activeIndex, setActiveIndex] = useState(0);
    const onMouseHover = useCallback(
        (_: unknown, index: number) => {
            setActiveIndex(index);
        },
        [setActiveIndex]
    );

    const data = [
        { name: "Passed", value: props.passed, color: "green" },
        { name: "Failed", value: props.failed, color: "red" },
        { name: "Skipped", value: props.skipped, color: "grey" },
    ];

    return (
        <GraphCard
            sx={{
                width: "35%",
                flexShrink: 1,
                p: "6px",
                gap: "10px",
            }}
        >
            <Stack
                display="flex"
                flexDirection="column"
                sx={{ alignSelf: "flex-start" }}
            >
                &nbsp;
                <Typography variant="caption">Executed,</Typography>
                <Typography variant="h6">
                    &nbsp;
                    <b>{`${props.skipped + props.passed + props.failed} `}</b>
                    Test cases
                </Typography>
                <Tooltip title={props.startDate.format()}>
                    <Typography variant="subtitle2">
                        &nbsp;&nbsp;{`${fromNow(props.startDate)}`}
                    </Typography>
                </Tooltip>
                <br />
                <Divider />
            </Stack>
            <PieChart width={200} height={200}>
                <Pie
                    activeIndex={activeIndex}
                    activeShape={renderActiveShape}
                    data={data}
                    innerRadius={60}
                    outerRadius={85}
                    fill="#8884d8"
                    strokeWidth={0}
                    dataKey="value"
                    nameKey={"name"}
                    onMouseEnter={onMouseHover}
                >
                    {data.map((status) => (
                        <Cell key={status.name} fill={status.color}></Cell>
                    ))}
                </Pie>
            </PieChart>
        </GraphCard>
    );
}

function OverviewOfFeatures(props: {
    features: Record<string, FeatureResult>;
}): ReactNode {
    const [activeIndex, setActiveIndex] = useState(0);
    const onMouseHover = useCallback(
        (_: unknown, index: number) => {
            setActiveIndex(index);
        },
        [setActiveIndex]
    );

    const data = Object.keys(props.features).map((feature, index) => ({
        name: feature,
        value:
            props.features[feature].passed +
            props.features[feature].failed +
            props.features[feature].skipped,
        passed: props.features[feature].passed,
        skipped: props.features[feature].skipped,
        failed: props.features[feature].failed,
        color: schemeSet2[index % schemeSet2.length],
    }));

    console.log(data);

    return (
        <GraphCard
            sx={{
                width: "35%",
            }}
        >
            <ResponsiveContainer width={200} height={200}>
                <PieChart>
                    <Pie
                        activeIndex={activeIndex}
                        activeShape={renderActiveShape}
                        data={data}
                        innerRadius={60}
                        outerRadius={85}
                        strokeWidth={0}
                        dataKey="value"
                        nameKey={"name"}
                        onMouseEnter={onMouseHover}
                    >
                        {data.map((status) => (
                            <Cell key={status.name} fill={status.color}></Cell>
                        ))}
                    </Pie>
                </PieChart>
            </ResponsiveContainer>
        </GraphCard>
    );
}

function KeyValuePairs(props: {
    vars: Record<string, number | string | boolean>;
}): ReactNode {
    const pairs = props.vars;
    const rowsPerPage = 5;
    const [page, setPage] = useState(0);
    const keyOfPairs = Object.keys(pairs);

    return (
        <TableContainer component={Paper}>
            <Table
                sx={{ minWidth: 500 }}
                aria-label="Key Value Pairs"
                size="small"
            >
                <TableHead>
                    <StyledTableRow>
                        <StyledTableCell>Key</StyledTableCell>
                        <StyledTableCell>Value</StyledTableCell>
                    </StyledTableRow>
                </TableHead>
                <TableBody>
                    {keyOfPairs
                        .slice(
                            page * rowsPerPage,
                            page * rowsPerPage + rowsPerPage
                        )
                        .map((row) => (
                            <StyledTableRow hover key={row}>
                                <StyledTableCell component="td" scope="row">
                                    {row}
                                </StyledTableCell>
                                <StyledTableCell component="td" scope="row">
                                    <Typography variant="subtitle2">
                                        {typeof pairs[row] === "boolean" ? (
                                            <Switch
                                                checked={true}
                                                size="small"
                                                sx={{ textAlign: "left" }}
                                            />
                                        ) : (
                                            <Typography variant="body2">
                                                {pairs[row]}
                                            </Typography>
                                        )}
                                    </Typography>
                                </StyledTableCell>
                            </StyledTableRow>
                        ))}
                    {/* {emptyRows > 0 && (
                        <TableRow style={{ height: 53 * emptyRows }}>
                            <TableCell colSpan={6} />
                        </TableRow>
                    )} */}
                </TableBody>
                {/* <TableFooter>
                    <TableRow>
                        <TablePagination
                            rowsPerPageOptions={[
                                5,
                                10,
                                25,
                                { label: "All", value: -1 },
                            ]}
                            colSpan={3}
                            count={rows.length}
                            rowsPerPage={rowsPerPage}
                            page={page}
                            SelectProps={{
                                inputProps: {
                                    "aria-label": "rows per page",
                                },
                                native: true,
                            }}
                            onPageChange={handleChangePage}
                            onRowsPerPageChange={handleChangeRowsPerPage}
                            ActionsComponent={TablePaginationActions}
                        />
                    </TableRow>
                </TableFooter> */}
            </Table>
        </TableContainer>
    );
}

export default function Overview(props: { fileName: string }): ReactNode {
    const { data, isLoading } = AskTestResult(props.fileName);

    if (data === undefined || isLoading) {
        return (
            <Stack gap={"2rem"} flexWrap="wrap">
                <Stack
                    flexDirection="row"
                    gap={"2rem"}
                    flexWrap="wrap"
                    justifyContent={"stretch"}
                >
                    <Skeleton
                        animation="pulse"
                        variant="rounded"
                        height={200}
                        width={400}
                    />
                    <Skeleton
                        animation="pulse"
                        height={200}
                        variant="rounded"
                        width={400}
                    />
                </Stack>
                <Stack flexDirection="row" gap={"2rem"} flexWrap="wrap">
                    <Skeleton
                        animation="pulse"
                        variant="rounded"
                        height={200}
                        width={400}
                    />
                    <Skeleton
                        animation="pulse"
                        height={200}
                        variant="rounded"
                        width={400}
                    />
                </Stack>
            </Stack>
        );
    }
    return (
        <Grid container gap={6} columns={4.5} spacing={2} sx={{ flexGrow: 1 }}>
            <Grid xs={1.69}>
                <ProgressPieChart
                    passed={data.passed}
                    failed={data.failed}
                    skipped={data.skipped}
                    startDate={readDateForKey(data.started)}
                />
            </Grid>
            <Grid xs={1.1}>
                <OverviewOfFeatures features={data.features} />
            </Grid>
            <Grid xs={2}>
                <KeyValuePairs vars={data.vars} />
            </Grid>
        </Grid>
    );
}

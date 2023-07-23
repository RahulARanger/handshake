import React, { useState, type ReactNode, useCallback, useMemo } from "react";
import CountUp from "react-countup";
import { Cell, Pie, PieChart } from "recharts";
import { DetailedTestResult, type FeatureResult } from "@/types/appConfig";
import Paper from "@mui/material/Paper";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Tooltip from "@mui/material/Tooltip";
import Divider from "@mui/material/Divider";
import Switch from "@mui/material/Switch";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import readDateForKey, { fromNow } from "./helper";
import GraphCard from "./graphCard";
import renderActiveShape from "./pieCharts";
import { schemeDark2 } from "d3-scale-chromatic";
import type dayjs from "dayjs";
import StyledTableCell, { StyledTableRow } from "./tableThings";
import Grid from "@mui/material/Grid";
import CarouselComponent from "./carousel";
import type Suite from "@/types/testRelated";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import { type ColDef } from "ag-grid-community";
import TestResultRenderer from "./testResult.bar";

function ProgressPieChart(props: {
    passed?: number;
    failed?: number;
    skipped?: number;
    startDate: dayjs.Dayjs;
    features: Record<string, FeatureResult>;
}): ReactNode {
    const total = useMemo<number>(
        () => (props.failed ?? 0) + (props.skipped ?? 0) + (props.passed ?? 0),
        [props.passed, props.failed, props.skipped]
    );

    return (
        <GraphCard
            sx={{
                flexShrink: 1,
                p: "6px",
                gap: "10px",
                flexWrap: "wrap",
            }}
        >
            <Grid container columns={4} gap={3}>
                <Grid md={1}>
                    &nbsp;
                    <Typography variant="caption">Executed,</Typography>
                    <Typography variant="h6">
                        <b>
                            &nbsp;
                            <CountUp
                                end={total}
                                useIndianSeparators={true}
                                formattingFn={(n) =>
                                    n
                                        .toString()
                                        .padStart(
                                            Math.floor(Math.log10(total) + 1),
                                            "0"
                                        )
                                }
                            />
                        </b>
                        &nbsp;Test cases
                    </Typography>
                    <Tooltip title={props.startDate.format()}>
                        <Typography variant="subtitle2">
                            &nbsp;&nbsp;{`${fromNow(props.startDate)}`}
                        </Typography>
                    </Tooltip>
                    <br />
                    <Divider />
                </Grid>
                <Grid md={1.2} mr={2}>
                    <TestCasesDistributionChart
                        passed={props.passed}
                        failed={props.failed}
                        skipped={props.skipped}
                    />
                </Grid>
                <Grid md={1.2}>
                    <OverviewOfFeatures features={props.features} />
                </Grid>
            </Grid>
        </GraphCard>
    );
}

function TestCasesDistributionChart(props: {
    passed?: number;
    failed?: number;
    skipped?: number;
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
            (props.features[feature].passed ?? 0) +
            (props.features[feature].failed ?? 0) +
            (props.features[feature].skipped ?? 0),
        passed: props.features[feature].passed,
        skipped: props.features[feature].skipped,
        failed: props.features[feature].failed,
        color: schemeDark2[index % schemeDark2.length],
    }));

    return (
        <PieChart width={200} height={200}>
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
                sx={{ minWidth: 250 }}
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

function TopTestSuites(props: { suites: Suite[] }): ReactNode {
    const columnDefs: ColDef[] = [
        {
            field: "parent",
            headerName: "Feature",
            filter: true,
            resizable: true,
            sortable: true,
            width: 120,
        },
        {
            field: "title",
            headerName: "Suite",
            filter: true,
            resizable: true,
            sortable: true,
        },
        {
            valueGetter: (params) => [
                params.data.passed,
                params.data.failed,
                params.data.skipped,
            ],
            headerName: "Progress",
            cellRenderer: TestResultRenderer,
            sortable: true,
            comparator: (valueA: number[], valueB: number[]) =>
                valueA[0] / (valueA[0] + valueA[1] + valueA[2]) -
                valueB[0] / (valueB[0] + valueB[1] + valueB[2]),
        },
        {
            field: "duration",
            headerName: "Duration (s)",
            filter: true,
            resizable: true,
            sortable: true,
            width: 125,
            valueFormatter: (params) => (params.value / 1e3).toFixed(1),
        },
    ];

    // const rows = props.suites.map((suite) => {
    //     return { id: suite.id, title: suite.title, parent: suite.parent };
    // });

    return (
        <Paper
            sx={{ height: "100%", flexGrow: 1, minHeight: "210px" }}
            className="ag-theme-alpine-dark"
        >
            <AgGridReact
                columnDefs={columnDefs}
                animateRows={true}
                rowData={props.suites}
            />
        </Paper>
    );
}

export default function Overview(props: {
    details: DetailedTestResult;
}): ReactNode {
    const data = props.details;
    return (
        <Grid
            container
            gap={6}
            columns={4.5}
            spacing={2}
            sx={{ bgColor: "background.default", flexGrow: 1 }}
        >
            <Grid md={2.5} sm={3} minWidth={"250px"}>
                <ProgressPieChart
                    passed={data.passed}
                    failed={data.failed}
                    skipped={data.skipped}
                    startDate={readDateForKey(data.started)}
                    features={data.features}
                />
            </Grid>
            <Grid md={1.5} sm={2} minWidth={"250px"}>
                <CarouselComponent />
            </Grid>
            <Grid md={2.5} sm={3} minWidth={"250px"}>
                <TopTestSuites
                    suites={Object.values(data.features).flatMap(
                        (feature) => feature.suites
                    )}
                />
            </Grid>
            <Grid md={1.5} sm={2} minWidth={"250px"}>
                <KeyValuePairs vars={data.vars} />
            </Grid>
        </Grid>
    );
}

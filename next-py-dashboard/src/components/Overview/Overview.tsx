import React, { type ReactNode } from "react";
import readDateForKey, { getTestRun } from "@/Generators/helper";
import Grid from "@mui/material/Grid";
import CarouselComponent from "../carousel";
import type DetailsOfRun from "@/types/testRun";
import { type OverviewPageProps } from "@/types/detailedTestRunPage";
import useSWR from "swr";
import TestEntities, { ImportantThings } from "../Table/TableEntities";
import ProgressPieChart from "./overviewChart";

export default function Overview(props: OverviewPageProps): ReactNode {
    const { data } = useSWR<DetailsOfRun>(getTestRun(props.test_id));
    if (data == null) return <>Report not found</>;
    return (
        <Grid
            container
            gap={6}
            columns={4.5}
            spacing={2}
            sx={{ bgColor: "background.default", flexGrow: 1 }}
        >
            <Grid item md={2} sm={3} minWidth={"250px"}>
                <ProgressPieChart
                    test_id={props.test_id}
                    startDate={readDateForKey(data.started)}
                />
            </Grid>
            <Grid item md={2} sm={2} minWidth={"250px"}>
                <CarouselComponent />
            </Grid>
            <Grid item md={3} sm={3}>
                <TestEntities test_id={props.test_id} />
            </Grid>
            <Grid item md={1.25} sm={3}>
                <ImportantThings />
            </Grid>
        </Grid>
    );
}

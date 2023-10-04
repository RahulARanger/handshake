import { type GetStaticPropsResult } from "next";
import React, { type ReactNode } from "react";
import getConnection from "@/Generators/dbConnection";
import { getLogger } from "log4js";
import { getAllTestRunDetails } from "@/Generators/Queries/testRunRelated";
import type DetailsOfRun from "@/types/testRun";
import GridOfRuns from "@/components/ListOfRuns";

export async function getStaticProps(prepareProps: {
    params: {
        id: string;
    };
}): Promise<GetStaticPropsResult<{ runs: DetailsOfRun[] }>> {
    const logger = getLogger("Run-Page");
    logger.level = "debug";

    logger.info("Generating Cards for all Runs");

    const connection = await getConnection();
    const allRuns = await getAllTestRunDetails(connection);
    await connection.close();

    return {
        props: { runs: allRuns ?? [] },
    };
}

export default function AllTestRunsDisplayedHere(props: {
    runs: DetailsOfRun[];
}): ReactNode {
    return <GridOfRuns runs={props.runs} />;
}

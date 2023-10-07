import { type GetStaticPropsResult } from "next";
import React, { type ReactNode } from "react";
import getConnection from "@/Generators/dbConnection";
import { getLogger } from "log4js";
import { getAllTestRunDetails } from "@/Generators/Queries/testRunRelated";
import type DetailsOfRun from "@/types/testRun";
import GridOfRuns from "@/components/ListOfRuns";
import currentExportConfig from "@/Generators/Queries/exportConfig";

export async function getStaticProps(prepareProps: {
    params: {
        id: string;
    };
}): Promise<GetStaticPropsResult<{ runs?: DetailsOfRun[] }>> {
    const logger = getLogger("Run-Page");
    logger.level = "debug";

    const connection = await getConnection();
    const exportConfig = await currentExportConfig(connection);

    if (exportConfig?.isDynamic === true) {
        logger.info("Skipping /RUNS route for the dynamic export");
        return { props: { runs: undefined } };
    }

    const allRuns = await getAllTestRunDetails(connection);
    if ((allRuns?.length ?? 0) > 0)
        logger.info("Found Test Runs, Generating page.");

    await connection.close();

    return {
        props: { runs: allRuns ?? [] },
    };
}

export default function AllTestRunsDisplayedHere(props: {
    runs?: DetailsOfRun[];
}): ReactNode {
    if (props.runs == null) return <></>;
    return <GridOfRuns runs={props.runs} />;
}

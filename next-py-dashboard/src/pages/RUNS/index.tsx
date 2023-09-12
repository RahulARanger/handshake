import { type GetStaticPropsResult } from "next";
import React, { type ReactNode } from "react";
import getConnection from "@/Generators/dbConnection";
import { getLogger } from "log4js";
import { getAllTestRunDetails } from "@/Generators/Queries/testRunRelated";
import type DetailsOfRun from "@/types/testRun";
import dynamic from "next/dynamic";
const GridOfRuns = dynamic(
    async () => await import("@/components/GridView/gridOfRuns"),
    { ssr: false }
);

const logger = getLogger("Run-Page");

export async function getStaticProps(prepareProps: {
    params: {
        id: string;
    };
}): Promise<GetStaticPropsResult<{ runs: DetailsOfRun[] }>> {
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

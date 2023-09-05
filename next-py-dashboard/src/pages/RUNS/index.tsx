import { type GetStaticPropsResult } from "next";
import React, { type ReactNode } from "react";
import getConnection from "@/Generators/dbConnection";
import { getLogger } from "log4js";
import latestTestRun from "@/Generators/Queries/testRunRelated";

export async function getStaticProps(): Promise<
    GetStaticPropsResult<{ redirect: { destination: string } }>
> {
    const logger = getLogger("Generate Test Run IDs");
    logger.info("🔝 Fetching latest test run...");

    const connection = await getConnection();
    const testID = await latestTestRun(connection);
    await connection.close();

    if (testID.length > 0) logger.info("✅ Fetched latest run");

    return {
        redirect: {
            permanent: false,
            destination:
                testID === "" ? "/RUNS/no-test-run-found" : `/RUNS/${testID}`,
        },
    };
}

export default function PageThatWeWontSee(props: unknown): ReactNode {
    return <>{props}</>;
}

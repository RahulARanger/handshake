import { getRecentRun } from "@/components/helper";
import { type GetStaticPropsResult } from "next";
import React, { type ReactNode } from "react";

export async function getStaticProps(): Promise<
    GetStaticPropsResult<{ redirect: { destination: string } }>
> {
    const resp = await fetch(getRecentRun(), {
        method: "GET",
    });
    return {
        redirect: {
            permanent: false,
            destination:
                resp.status === 404
                    ? "/RUNS/no-test-run-found"
                    : `/RUNS/${await resp.text()}`,
        },
    };
}

export default function PageThatWeWontSee(props: unknown): ReactNode {
    return <>{props}</>;
}

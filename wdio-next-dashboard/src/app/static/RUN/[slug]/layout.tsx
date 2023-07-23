"use client";

import EmptyState from "@/components/NotExecutedYet";
import { AskStaticConfig, AskTestResult } from "@/components/askThings";
import React, { type ReactNode } from "react";

interface GenerateResults {
    slug: string;
}

export async function generateStaticParams(): Promise<GenerateResults[]> {
    const { data } = AskStaticConfig();
    console.log(data);
    if (data === undefined) return [];
    return Object.keys(data).map((file) => ({ slug: file }));
}

export default function EnsureFile({
    children,
    params,
}: {
    children: ReactNode;
    params: { slug: string };
}): ReactNode {
    const fileName = params.slug;
    const { isLoading, error } = AskTestResult(fileName);
    if (isLoading || (error?.length ?? 0) > 0)
        return <EmptyState isLoading={isLoading} error={String(error)} />;
    return children;
}

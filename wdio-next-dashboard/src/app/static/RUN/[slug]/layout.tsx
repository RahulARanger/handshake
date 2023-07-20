"use client";
import EmptyState from "@/components/NotExecutedYet";
import { AskTestResult } from "@/components/askThings";
import React, { type ReactNode } from "react";

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

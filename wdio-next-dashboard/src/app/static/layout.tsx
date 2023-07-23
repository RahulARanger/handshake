"use client";

import EmptyState from "@/components/NotExecutedYet";
import { AskStaticConfig } from "@/components/askThings";
import React, { type ReactNode } from "react";

export default function RootLayout({
    children,
}: {
    children: ReactNode;
}): ReactNode {
    const { error, data, isLoading } = AskStaticConfig();

    console.log(data, "jere", isLoading, error);
    if (data !== undefined) return children;
    return <EmptyState error={String(error)} isLoading={isLoading} />;
}

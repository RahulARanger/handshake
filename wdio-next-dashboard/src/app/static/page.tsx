"use client";

import React, { type ReactNode } from "react";
import { AskStaticConfig } from "@/components/askThings";
import readDateForKey, { toFileString } from "@/components/helper";
import { redirect } from "next/navigation";
import { Typography } from "@mui/material";

export default function RedirectToTest(): ReactNode {
    const { data } = AskStaticConfig();
    if (data === undefined) return <>No Data found</>;

    const mostRecent = Object.keys(data).reduce((prevValue, currentValue) => {
        const prevDate = readDateForKey(prevValue);
        const currentDate = readDateForKey(currentValue);
        return prevDate > currentDate ? prevValue : currentValue;
    });

    const mostRecentDate = readDateForKey(mostRecent);

    if (!mostRecentDate.isValid())
        return (
            <Typography
                variant="h5"
                color="paleturquoise"
            >{`Found invalid date: ${mostRecent}`}</Typography>
        );

    return redirect(`./static/RUN/${toFileString(mostRecentDate)}`);
}

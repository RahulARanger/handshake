import React, { Component, type ReactNode } from "react";
import readDateForKey, { toFileString } from "@/components/helper";
import staticConfig from "@/components/askFromFiles";
import { GetStaticPropsResult, GetStaticPropsContext } from "next";
import EmptyState from "@/components/NotExecutedYet";

export default class Filler extends Component<{
    failed: string | false;
    date?: string;
}> {
    render() {
        return (
            <EmptyState
                error={this.props.failed || undefined}
                isLoading={this.props.failed ? false : true}
            />
        );
    }

    componentDidMount(): void {
        if (!this.props.failed && this.props.date) {
            const showHTML = process.env.HIDE_HTML ? "" : ".html";
            window.location.replace(
                `./static/RUN/${this.props.date}${showHTML}`
            );
        }
    }
}

export function getStaticProps(
    _: GetStaticPropsContext
): GetStaticPropsResult<unknown> {
    try {
        const data = staticConfig();
        const mostRecent = Object.keys(data).reduce(
            (prevValue, currentValue) => {
                const prevDate = readDateForKey(prevValue);
                const currentDate = readDateForKey(currentValue);
                return prevDate > currentDate ? prevValue : currentValue;
            }
        );
        const mostRecentDate = readDateForKey(mostRecent);

        if (!mostRecentDate.isValid())
            return {
                props: {
                    failed: "found an invalid date, probably we didn't execute any test case",
                },
            };
        return {
            props: {
                failed: false,
                date: toFileString(mostRecentDate),
            },
        };
    } catch (error) {
        return {
            props: {
                failed: "Failed to find the latest test case file",
            },
        };
    }
}

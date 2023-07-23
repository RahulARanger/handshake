import React, { Component, type ReactNode } from "react";
import Stack from "@mui/material/Stack";
import { Header } from "@/components/header";
import Tab from "@mui/material/Tab";
import TabContext from "@mui/lab/TabContext";
import TabList from "@mui/lab/TabList";
import TabPanel from "@mui/lab/TabPanel";
import Divider from "@mui/material/Divider";
import Overview from "@/components/overview";
import {
    GetStaticPathsResult,
    GetStaticPropsContext,
    GetStaticPropsResult,
} from "next";
import EmptyState from "@/components/NotExecutedYet";
import staticConfig, { readTestCase } from "@/components/askFromFiles";
import { DetailedTestResult } from "@/types/appConfig";
import readDateForKey, { toFileString } from "@/components/helper";

interface FileRelated {
    details?: DetailedTestResult;
    failed?: string;
}

export function getStaticPaths(
    path: GetStaticPropsContext
): GetStaticPathsResult {
    const data = staticConfig();
    return {
        paths: Object.keys(data).map((key) => ({
            params: { slug: toFileString(readDateForKey(key)) },
        })),
        fallback: false,
    };
}

export function getStaticProps(
    path: GetStaticPropsContext
): GetStaticPropsResult<FileRelated> {
    try {
        const expectedSlug = path.params?.slug;
        if (typeof expectedSlug !== "string")
            throw new Error(`Invalid file: ${expectedSlug}, Not Found.`);
        const details = readTestCase(expectedSlug);
        return { props: { details: details } };
    } catch (error) {
        return {
            props: {
                failed: `Failed to load the resulted test file: ${path.params?.slug}`,
            },
        };
    }
}

interface MainPageStates {
    currentTabIndex: string;
}

export default class MainPage extends Component<FileRelated, MainPageStates> {
    overview = "overview";
    timeline = "timeline";
    state: MainPageStates = { currentTabIndex: "overview" };

    tabThings(details: DetailedTestResult): ReactNode {
        return (
            <>
                <Stack
                    display="flex"
                    flexDirection="row"
                    width="100%"
                    justifyContent={"space-between"}
                    flexGrow={1}
                >
                    <Stack sx={{ flexGrow: 1 }}>
                        <TabPanel value={this.overview}>
                            <Overview details={details} />
                        </TabPanel>
                        <TabPanel value="3">Item Three</TabPanel>
                        <TabPanel value={this.timeline}>Timeline</TabPanel>
                    </Stack>
                    <Divider orientation="vertical" />
                    <TabList
                        onChange={(_: unknown, selected: string) => {
                            this.setState({ currentTabIndex: selected });
                        }}
                        aria-label="Tabs in Dashboard"
                        orientation="vertical"
                        sx={{
                            minWidth: "95px",
                            width: "95px",
                            position: "sticky",
                            top: 0,
                            alignSelf: "flex-start",
                        }}
                    >
                        <Tab label="Overview" value={this.overview} />
                        <Tab label="Timeline" value={this.timeline} />
                        <Tab label="Item Three" value="3" />
                    </TabList>
                </Stack>
            </>
        );
    }
    render() {
        if (this.props.failed || !this.props.details) {
            return <EmptyState error={this.props.failed} isLoading={false} />;
        }

        const details = this.props.details;
        return (
            <Stack display="flex" flexDirection="column" height="100%">
                <Header
                    name={details.name}
                    version={details.version}
                    finishedAt={details.finished}
                ></Header>
                <TabContext value={this.state.currentTabIndex}>
                    {this.tabThings(details)}
                </TabContext>
            </Stack>
        );
    }
}

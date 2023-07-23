"use client";

import React, { Component, type ReactNode } from "react";
import Stack from "@mui/material/Stack";
import { Header } from "@/components/header";
import Tab from "@mui/material/Tab";
import TabContext from "@mui/lab/TabContext";
import TabList from "@mui/lab/TabList";
import TabPanel from "@mui/lab/TabPanel";
import Divider from "@mui/material/Divider";
import Overview from "@/components/overview";

interface MainPageStates {
    currentTabIndex: string;
}

export default class MainPage extends Component<
    { params: { slug: string } },
    MainPageStates
> {
    overview = "overview";
    timeline = "timeline";
    state: MainPageStates = { currentTabIndex: "overview" };

    tabThings(): ReactNode {
        const fileName = this.props.params.slug;

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
                            <Overview fileName={fileName} />
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

    render(): ReactNode {
        return (
            <Stack display="flex" flexDirection="column" height="100%">
                <Header file={this.props.params.slug}></Header>
                <TabContext value={this.state.currentTabIndex}>
                    {this.tabThings()}
                </TabContext>
            </Stack>
        );
    }
}

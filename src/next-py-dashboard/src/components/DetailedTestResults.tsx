import { type OverviewPageProps } from "@/types/detailedTestRunPage";
import Stack from "@mui/material/Stack";
import Tab from "@mui/material/Tab";
import TabContext from "@mui/lab/TabContext";
import TabList from "@mui/lab/TabList";
import TabPanel from "@mui/lab/TabPanel";
import Divider from "@mui/material/Divider";
import Overview from "@/components/Overview/Overview";
import React, { useState, type ReactNode } from "react";

export function DetailedTestResults(props: OverviewPageProps): ReactNode {
    const overview = "overview";
    const [tabState, setTestTabState] = useState({ currentTabIndex: overview });
    return (
        <TabContext value={tabState.currentTabIndex}>
            <Stack
                display="flex"
                flexDirection="row"
                width="100%"
                justifyContent={"space-between"}
                flexGrow={1}
            >
                <Stack sx={{ flexGrow: 1 }}>
                    <TabPanel value={overview}>
                        <Overview getTestRun={props.getTestRun} getSuites={props.getSuites}/>
                    </TabPanel>
                </Stack>
                <Divider orientation="vertical" />
                <TabList
                    onChange={(_: unknown, selected: string) => {
                        setTestTabState({ currentTabIndex: selected });
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
                    <Tab label="Overview" value={overview} />
                </TabList>
            </Stack>
        </TabContext>
    );
}

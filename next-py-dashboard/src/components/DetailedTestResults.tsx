import { type OverviewPageProps } from "@/types/detailedTestRunPage";
import Overview from "@/components/Overview/Overview";
import React, { useState, type ReactNode } from "react";
import HeaderBarStyles from "@/styles/header.module.css";
import { AppBar } from "@mui/material";
import dynamic from "next/dynamic";
import GanttChart from "./GridView/ganttChart";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";

const OverAllTestEntities = dynamic(
    async () => await import("@/components/GridView/OverallTestEntities"),
    { ssr: false }
);

export function DetailedTestResults(props: OverviewPageProps): ReactNode {
    const overview = 0;
    const grid = 1;
    const gantt = 2;

    const [selectedTab, setSelectedTab] = useState(overview);
    const marginStyle = { margin: "10px", marginTop: "15px" };

    return (
        <>
            <div
                role="tabpanel"
                hidden={overview !== selectedTab}
                id={`vertical-tabpanel-${selectedTab}`}
                aria-labelledby={`vertical-tab-${selectedTab}`}
                style={marginStyle}
            >
                {overview === selectedTab && (
                    <Overview port={props.port} test_id={props.test_id} />
                )}
            </div>
            <div
                role="tabpanel"
                hidden={grid !== selectedTab}
                id={`vertical-tabpanel-${selectedTab}`}
                aria-labelledby={`vertical-tab-${selectedTab}`}
                style={marginStyle}
            >
                {grid === selectedTab && (
                    <OverAllTestEntities
                        port={props.port}
                        test_id={props.test_id}
                    />
                )}
            </div>
            <div
                role="tabpanel"
                hidden={gantt !== selectedTab}
                id={`vertical-tabpanel-${selectedTab}`}
                aria-labelledby={`vertical-tab-${selectedTab}`}
                style={marginStyle}
            >
                {gantt === selectedTab && (
                    <GanttChart port={props.port} test_id={props.test_id} />
                )}
            </div>
            <AppBar
                position="sticky"
                className={HeaderBarStyles.tabListHeader}
                sx={{ backgroundColor: "transparent" }}
            >
                <Tabs
                    value={selectedTab}
                    onChange={(_, newState: number) => {
                        const moveTo = newState ?? selectedTab;
                        setSelectedTab(moveTo);
                    }}
                    variant="scrollable"
                    scrollButtons="auto"
                    allowScrollButtonsMobile
                    aria-label="Tabs "
                >
                    <Tab label="Overview" value={overview} />
                    <Tab label="Grid View" value={grid} />
                    <Tab label="Gantt" value={gantt} />
                </Tabs>
            </AppBar>
        </>
    );
}

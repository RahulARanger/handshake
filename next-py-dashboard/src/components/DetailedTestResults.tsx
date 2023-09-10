import { type OverviewPageProps } from "@/types/detailedTestRunPage";
import carouselStyles from "@/styles/carousel.module.css";
import Overview from "@/components/Overview/Overview";
import React, { useCallback, useState, type ReactNode } from "react";
import HomeIcon from "@mui/icons-material/Home";
import GridOnIcon from "@mui/icons-material/GridOn";
import HeaderBarStyles from "@/styles/header.module.css";
import useEmblaCarousel from "embla-carousel-react";
import { clsx } from "clsx";
import { AppBar } from "@mui/material";
import ToggleButton from "@mui/material/ToggleButton";
import StyledToggleButtonGroup from "./Overview/toggleButton";
import dynamic from "next/dynamic";
const OverAllTestEntities = dynamic(
    async () => await import("@/components/GridView/OverallTestEntities"),
    { ssr: false }
);

export function DetailedTestResults(props: OverviewPageProps): ReactNode {
    const overview = 0;
    const grid = 1;
    const [selectedTab, setSelectedTab] = useState(overview);
    const [emblaRef, emblaApi] = useEmblaCarousel({
        watchDrag: false,
    });

    const scrollTo = useCallback(
        (index: number) => {
            emblaApi?.scrollTo(index);
        },
        [emblaApi]
    );

    return (
        <>
            <div
                className={carouselStyles.embla}
                ref={emblaRef}
                style={{ height: "100%", padding: "12px" }}
            >
                <div
                    className={clsx(
                        carouselStyles.container,
                        carouselStyles.fullPageContainer
                    )}
                >
                    <div className={carouselStyles.slide}>
                        <Overview port={props.port} test_id={props.test_id} />
                    </div>
                    <div className={carouselStyles.slide}>
                        <OverAllTestEntities
                            port={props.port}
                            test_id={props.test_id}
                        />
                    </div>
                </div>
            </div>
            <AppBar
                position="sticky"
                className={HeaderBarStyles.tabListHeader}
                sx={{ backgroundColor: "transparent" }}
            >
                <StyledToggleButtonGroup
                    size="small"
                    exclusive
                    value={selectedTab}
                    onChange={(_, newState: number) => {
                        const moveTo = newState ?? selectedTab;
                        setSelectedTab(moveTo);
                        scrollTo(moveTo);
                    }}
                    className={HeaderBarStyles.tabList}
                >
                    <ToggleButton value={overview}>
                        <HomeIcon />
                    </ToggleButton>
                    <ToggleButton value={grid}>
                        <GridOnIcon />
                    </ToggleButton>
                </StyledToggleButtonGroup>
            </AppBar>
        </>
    );
}

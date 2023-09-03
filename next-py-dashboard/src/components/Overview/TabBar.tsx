import React, { styled } from "@mui/material/styles";
import Tab, { type TabProps } from "@mui/material/Tab";
import TabList, { type TabListProps } from "@mui/lab/TabList";

export const NiceTab = styled((props: TabProps) => (
    <Tab disableRipple {...props} />
))(({ theme }) => ({
    borderRadius: 10,
    textTransform: "none",
    [theme.breakpoints.up("sm")]: {
        minWidth: 0,
    },
    [theme.breakpoints.down("md")]: {
        fontSize: 0,
    },
    transition: theme.transitions.create("all", {
        duration: theme.transitions.duration.shortest,
    }),
    fontWeight: theme.typography.fontWeightRegular,
    marginRight: theme.spacing(1),
    marginBottom: theme.spacing(1),
    marginTop: theme.spacing(1),
    color: theme.palette.primary.light,
    boxShadow: theme.shadows[6],
    "&:hover": {
        opacity: 1,
        color: theme.palette.secondary.main,
        boxShadow: theme.shadows[7],
    },
    "&.Mui-selected": {
        color: theme.palette.primary.main,
        backgroundColor: theme.palette.background.paper,
        fontWeight: theme.typography.fontWeightBold,
        boxShadow: theme.shadows[9],
    },
    "&.Mui-focusVisible": {
        backgroundColor: "#d1eaff",
    },
}));

export const NiceTabList = styled((props: TabListProps) => (
    <TabList {...props} />
))(({ theme }) => ({
    height: "100%",
    // backgroundColor: theme.palette.action.selected,
    position: "absolute",
    left: "20px",
    paddingLeft: "12px",
    [theme.breakpoints.down("md")]: {
        paddingLeft: "40px",
    },
}));

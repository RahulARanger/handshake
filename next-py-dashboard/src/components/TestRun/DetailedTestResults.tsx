import React, { useContext, type ReactNode } from "react";
import { getTestRun } from "@/Generators/helper";
import type DetailsOfRun from "@/types/testRun";
import useSWR from "swr";
import Layout from "antd/lib/layout/index";
import HeaderStyles from "@/styles/header.module.css";
import Empty from "antd/lib/empty/index";
import Space from "antd/lib/space";
import Tabs from "antd/lib/tabs/index";
import BreadCrumb from "antd/lib/breadcrumb/Breadcrumb";
import RelativeTime from "../Datetime/relativeTime";
import dayjs from "dayjs";
import { crumbsForRun } from "../GridView/Items";
import type { Tab } from "rc-tabs/lib/interface";
import Overview from "./Overview";
import MetaCallContext from "./context";

export default function DetailedTestRun(): ReactNode {
    const { port, testID } = useContext(MetaCallContext);
    const { data } = useSWR<DetailsOfRun>(getTestRun(port, testID));

    if (data == null) {
        return (
            <Layout style={{ height: "100%" }}>
                <Space
                    direction="horizontal"
                    style={{ height: "100%", justifyContent: "center" }}
                >
                    <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description={`Report: ${
                            testID ?? "not-passed"
                        } is not available. Please raise an issue if you think it is a valid one.`}
                    />
                </Space>
            </Layout>
        );
    }

    const items: Tab[] = [
        {
            label: "Overview",
            children: <Overview run={data} />,
            key: "overview",
        },
    ];

    return (
        <Layout style={{ margin: "6px", overflow: "hidden", height: "98vh" }}>
            <Layout.Header className={HeaderStyles.header} spellCheck>
                <Space
                    align="baseline"
                    size="large"
                    style={{
                        width: "100%",
                        justifyContent: "space-between",
                        marginTop: "6px",
                    }}
                >
                    <BreadCrumb items={crumbsForRun(data.projectName)} />
                    <Space>
                        <RelativeTime dateTime={dayjs(data.ended)} />
                    </Space>
                </Space>
            </Layout.Header>
            <Layout.Content
                style={{
                    marginLeft: "12px",
                    overflow: "auto",
                }}
            >
                <Tabs items={items} size="small" />
            </Layout.Content>
        </Layout>
    );
    // return (
    //     <Grid
    //         container
    //         gap={6}
    //         columns={4.5}
    //         spacing={2}
    //         sx={{ bgColor: "background.default", flexGrow: 1 }}
    //     >
    //         <Grid item md={2} sm={2} minWidth={"250px"}>
    //             <CarouselComponent />
    //         </Grid>
    //         <Grid item md={3} sm={3}>
    //             <TestEntities port={props.port} test_id={props.test_id} />
    //         </Grid>
    //         <Grid item md={1.25} sm={3}>
    //             <ImportantThings />
    //         </Grid>
    //     </Grid>
    // );
}

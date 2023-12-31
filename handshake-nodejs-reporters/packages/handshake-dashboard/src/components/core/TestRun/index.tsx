import {
    detailedPage,
    getTestRun,
    runPage,
} from 'src/components/scripts/helper';
import type TestRunRecord from 'src/types/test-run-records';
import RelativeTo from 'src/components/utils/Datetime/relative-time';
import { dateFormatUsed } from 'src/components/utils/Datetime/format';
import { timelineTab, menuTabs } from 'src/types/ui-constants';

import React, { useContext, type ReactNode } from 'react';

import useSWR from 'swr';
import Layout from 'antd/lib/layout/index';
import BreadCrumb from 'antd/lib/breadcrumb/Breadcrumb';
import dayjs from 'dayjs';
import { crumbsForRun } from '../ListOfRuns/test-items';
import MetaCallContext from './context';
import HomeOutlined from '@ant-design/icons/HomeOutlined';
import TableOutlined from '@ant-design/icons/TableOutlined';
import PartitionOutlined from '@ant-design/icons/PartitionOutlined';
import type { MenuProps } from 'antd/lib/menu/menu';
import Menu from 'antd/lib/menu/menu';
import HeaderStyles from 'src/styles/header.module.css';
import Link from 'next/link';
import StarFilled from '@ant-design/icons/StarFilled';

export default function LayoutStructureForRunDetails(properties: {
    children: ReactNode;
    activeTab: string;
    changeDefault?: (tab: string) => void;
}): ReactNode {
    const { port, testID } = useContext(MetaCallContext);
    const { data } = useSWR<TestRunRecord>(getTestRun(port, testID));

    if (data == undefined) {
        return <></>;
    }

    const items: MenuProps['items'] = [
        {
            label: <Link href={runPage(data.testID)}>Overview</Link>,
            key: menuTabs.overviewTab,
            icon: <HomeOutlined />,
        },
        {
            label: 'Detailed',
            key: menuTabs.testEntitiesTab.current,
            icon: <StarFilled />,
            children: [
                {
                    label: (
                        <Link
                            id="Test Entities"
                            href={detailedPage(
                                data.testID,
                                menuTabs.testEntitiesTab.gridViewMode,
                            )}
                        >
                            Test Entities
                        </Link>
                    ),
                    key: menuTabs.testEntitiesTab.gridViewMode,
                    icon: <TableOutlined />,
                },
                {
                    label: (
                        <Link
                            id="Tree"
                            href={detailedPage(
                                data.testID,
                                menuTabs.testEntitiesTab.treeViewMode,
                            )}
                        >
                            Tree Structure
                        </Link>
                    ),
                    key: menuTabs.testEntitiesTab.treeViewMode,
                    icon: <PartitionOutlined />,
                },

                {
                    label: 'Timeline',
                    key: timelineTab,
                    disabled: true,
                },
            ],
        },
    ];

    return (
        <Layout style={{ overflow: 'hidden', height: '99.3vh' }}>
            <Layout.Header
                className={HeaderStyles.header}
                style={{
                    position: 'sticky',
                    top: 0,
                }}
            >
                <BreadCrumb items={crumbsForRun(data.projectName)} />
                <RelativeTo
                    dateTime={dayjs(data.ended)}
                    style={{
                        maxWidth: '130px',
                        textAlign: 'right',
                        marginRight: '10px',
                    }}
                    format={dateFormatUsed}
                    autoPlay={true}
                />
            </Layout.Header>

            <Layout>
                <Layout.Sider
                    breakpoint="lg"
                    collapsedWidth="0"
                    theme="light"
                    className={HeaderStyles.sider}
                >
                    <Menu
                        mode="inline"
                        items={items}
                        style={{ borderRadius: '1rem' }}
                        defaultOpenKeys={[menuTabs.testEntitiesTab.current]}
                        defaultSelectedKeys={[properties.activeTab]}
                        onClick={(event) =>
                            properties.changeDefault &&
                            properties.changeDefault(event.key)
                        }
                    />
                </Layout.Sider>
                <Layout.Content
                    style={{
                        marginLeft: '9px',
                        marginRight: '4px',
                        marginTop: '4px',
                        overflowY: 'auto',
                        marginBottom: '3px',
                        overflowX: 'hidden',
                    }}
                >
                    {properties.children}
                </Layout.Content>
            </Layout>
        </Layout>
    );
}

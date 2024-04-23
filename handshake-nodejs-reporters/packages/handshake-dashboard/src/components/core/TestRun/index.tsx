import { detailedPage, runPage } from 'components/links';
import RelativeTo from 'components/datetime/relative-time';
import { dateFormatUsed } from 'components/datetime/format';
import { menuTabs } from 'types/ui-constants';
import React, { useContext, type ReactNode } from 'react';
import Layout from 'antd/lib/layout/index';
import Text from 'antd/lib/typography/Text';
import BreadCrumb from 'antd/lib/breadcrumb/Breadcrumb';
import { crumbsForRun } from '../ListOfRuns/test-items';
import HomeOutlined from '@ant-design/icons/HomeOutlined';
import TableOutlined from '@ant-design/icons/TableOutlined';
import PartitionOutlined from '@ant-design/icons/PartitionOutlined';
import type { MenuProps } from 'antd/lib/menu/menu';
import Menu from 'antd/lib/menu/menu';
import HeaderStyles from 'styles/header.module.css';
import Link from 'next/link';
import { DetailedContext } from 'types/records-in-detailed';

export default function LayoutStructureForRunDetails(properties: {
    children: ReactNode;
    activeTab: string;
    highlight?: string;
    changeDefault?: (tab: string) => void;
}): ReactNode {
    const context = useContext(DetailedContext);
    if (context == undefined) {
        return <></>;
    }
    const { detailsOfTestRun: data } = context;
    const items: MenuProps['items'] = [
        {
            label: <Link href={runPage(data.Id)}>Overview</Link>,
            key: menuTabs.overviewTab,
            icon: <HomeOutlined />,
        },
        {
            label: (
                <Link
                    id="Test Entities"
                    href={detailedPage(
                        data.Id,
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
                        data.Id,
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
            key: 'timeline-upcoming',
            disabled: true,
        },
    ];

    return (
        <Layout
            style={{
                height: '99.3vh',
                overflow: 'auto',
            }}
        >
            <Layout.Header
                className={`${HeaderStyles.header}`}
                style={{
                    position: 'sticky',
                    top: 6,
                    zIndex: 10e2,
                }}
            >
                <BreadCrumb items={crumbsForRun(data.projectName)} />
                {properties.highlight ? (
                    <Text
                        id="highlight"
                        style={{
                            textShadow: 'rgba(0,208,255,0.9) 0px 0px 10px',
                        }}
                    >
                        {properties.highlight}
                    </Text>
                ) : (
                    <Menu
                        items={items}
                        mode="horizontal"
                        className="smooth-box"
                        defaultOpenKeys={[menuTabs.testEntitiesTab.current]}
                        defaultSelectedKeys={[properties.activeTab]}
                        onClick={(event) =>
                            properties.changeDefault &&
                            properties.changeDefault(event.key)
                        }
                        style={{
                            height: '30px',
                            minWidth: 0,
                            paddingTop: '3px',
                            backgroundColor: 'transparent',
                        }}
                    />
                )}

                <RelativeTo
                    dateTime={data.Ended[0]}
                    style={{
                        maxWidth: '130px',
                        marginRight: '10px',
                    }}
                    format={dateFormatUsed}
                    autoPlay={true}
                />
            </Layout.Header>
            <Layout>
                <Layout.Content
                    style={{
                        marginLeft: '9px',
                        marginRight: '4px',
                        marginTop: '4px',
                        overflowY: 'auto',
                        marginBottom: '6px',
                        paddingBottom: '15px',
                        overflow: 'unset',
                    }}
                >
                    {properties.children}
                </Layout.Content>
            </Layout>
        </Layout>
    );
}

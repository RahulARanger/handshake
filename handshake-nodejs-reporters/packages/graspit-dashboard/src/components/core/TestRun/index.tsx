import {
    detailedPage,
    getTestRun,
    runPage,
} from 'src/components/scripts/helper';
import type TestRunRecord from 'src/types/test-run-records';
import RelativeTo from 'src/components/utils/Datetime/relative-time';
import { dateFormatUsed } from 'src/components/utils/Datetime/format';
import {
    timelineTab,
    gridViewMode,
    overviewTab,
    testEntitiesTab,
} from 'src/types/ui-constants';

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
import Divider from 'antd/lib/divider/index';
import Link from 'next/link';

export default function DetailedTestRun(properties: {
    children: ReactNode;
    activeTab: string;
    show?: boolean;
    onChange?: (nowSelected: string) => void;
}): ReactNode {
    const { port, testID } = useContext(MetaCallContext);
    const { data } = useSWR<TestRunRecord>(getTestRun(port, testID));

    if (data == undefined) {
        return <></>;
    }

    const items: MenuProps['items'] = [
        {
            label: <Link href={runPage(data.testID)}>Overview</Link>,
            key: overviewTab,
            icon: <HomeOutlined />,
        },

        ...(properties.show
            ? [
                  {
                      label: 'Test Entities',
                      key: testEntitiesTab,
                      icon: gridViewMode ? (
                          <TableOutlined />
                      ) : (
                          <PartitionOutlined />
                      ),
                  },
                  {
                      label: 'Timeline',
                      key: timelineTab,
                      disabled: true,
                  },
              ]
            : [
                  {
                      label: (
                          <Link id="Detailed" href={detailedPage(data.testID)}>
                              Detailed
                          </Link>
                      ),
                      key: testEntitiesTab,
                      icon: gridViewMode ? (
                          <TableOutlined />
                      ) : (
                          <PartitionOutlined />
                      ),
                  },
              ]),
    ];

    const onClick: MenuProps['onClick'] = (event) => {
        properties.onChange && properties.onChange(event.key);
    };

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
                <Divider type="vertical" />
                <Menu
                    items={items}
                    mode="horizontal"
                    selectedKeys={[properties.activeTab]}
                    onClick={onClick}
                    className={HeaderStyles.tab}
                />
                <RelativeTo
                    dateTime={dayjs(data.ended)}
                    style={{ maxWidth: '130px' }}
                    format={dateFormatUsed}
                />
            </Layout.Header>
            <Layout.Content
                style={{
                    marginLeft: '12px',
                    marginTop: '2px',
                    overflowY: 'auto',
                    marginBottom: '3px',
                    overflowX: 'hidden',
                }}
            >
                {properties.children}
            </Layout.Content>
        </Layout>
    );
}

import React from 'react';
import type { ReactNode } from 'react';
import {
    Anchor,
    Breadcrumbs,
    Group,
    Menu,
    MenuDropdown,
    Text,
} from '@mantine/core';
import { IconCaretDown, IconGrid4x4, IconRipple } from '@tabler/icons-react';
import { runsPage, suitesPage, testRunPage } from 'components/links';
import { useRouter, type NextRouter } from 'next/router';
import ApplicationName from 'components/about-test-runs/application-name';

export type TestRunTab = 'Overview' | 'Suites';

export function redirectToRightPageForTestRun(
    router: NextRouter,
    testID: string,
    where: TestRunTab,
) {
    switch (where as TestRunTab) {
        case 'Overview': {
            router.push(testRunPage(testID));
            break;
        }
        case 'Suites': {
            router.push(suitesPage(testID));
            break;
        }
    }
}

export function testRunTabDescription(
    text: TestRunTab,
    isSuiteDetailedView?: boolean,
) {
    switch (text) {
        case 'Overview': {
            return 'an Overview of your Test Run';
        }
        case 'Suites': {
            return isSuiteDetailedView
                ? 'Suite Detailed View'
                : 'Grid of your Test Suites';
        }
        default: {
            return '';
        }
    }
}

export default function CurrentLocation(properties: {
    projectName: string;
    where: TestRunTab;
    toLoad?: boolean;
    testID?: string;
    isSuiteDetailedView?: boolean;
}): ReactNode {
    const toLoad = Boolean(properties.toLoad);
    const router = useRouter();

    return (
        <Group align="center" mb="xs">
            <Breadcrumbs mb={4}>
                <ApplicationName size="sm" />
                <Anchor size="sm" href={runsPage()}>
                    Runs
                </Anchor>
                <Text size="sm">
                    {toLoad ? '..--..' : properties.projectName}
                </Text>
                <Menu trigger="click-hover">
                    <Menu.Target>
                        <Text size="sm" mb={-4.5}>
                            {properties.where}
                            <sub>
                                <IconCaretDown
                                    size=".55rem"
                                    style={{ marginTop: 3.5, marginLeft: 2 }}
                                />
                            </sub>
                        </Text>
                    </Menu.Target>
                    <MenuDropdown>
                        <Menu.Item
                            disabled={!properties.testID}
                            leftSection={<IconRipple size=".9rem" />}
                            onClick={() =>
                                redirectToRightPageForTestRun(
                                    router,
                                    properties.testID as string,
                                    'Overview',
                                )
                            }
                        >
                            <Text size="sm">Overview</Text>
                        </Menu.Item>
                        <Menu.Item
                            leftSection={<IconGrid4x4 size=".9rem" />}
                            disabled={!properties.testID}
                            onClick={() =>
                                redirectToRightPageForTestRun(
                                    router,
                                    properties.testID as string,
                                    'Suites',
                                )
                            }
                        >
                            <Text size="sm">Suites</Text>
                        </Menu.Item>
                    </MenuDropdown>
                </Menu>
                {properties.isSuiteDetailedView ? (
                    <Text size="sm" mb={-4}>
                        Suite
                    </Text>
                ) : undefined}
            </Breadcrumbs>
            <Text size="xs" mb={-9} ml={-3.5} visibleFrom="md">
                {testRunTabDescription(
                    properties.where,
                    properties.isSuiteDetailedView,
                )}
            </Text>
        </Group>
    );
}

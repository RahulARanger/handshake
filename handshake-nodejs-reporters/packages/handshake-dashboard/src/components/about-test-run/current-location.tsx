import React from 'react';
import type { ReactNode } from 'react';
import {
    Anchor,
    Breadcrumbs,
    Group,
    Menu,
    MenuDropdown,
    rem,
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

export function testRunTabDescription(text: TestRunTab) {
    switch (text) {
        case 'Overview': {
            return 'an Overview of your Test Run';
        }
        case 'Suites': {
            return 'Grid of your Test Suites';
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
                        <Text size="sm">
                            {properties.where}
                            <sub>
                                <IconCaretDown
                                    size=".55rem"
                                    style={{ marginTop: rem(13) }}
                                />
                            </sub>
                        </Text>
                    </Menu.Target>
                    <MenuDropdown>
                        <Menu.Item
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
            </Breadcrumbs>
            <Text size="xs">{testRunTabDescription(properties.where)}</Text>
        </Group>
    );
}

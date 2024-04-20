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
import { IconCaretDown, IconRipple } from '@tabler/icons-react';
import { runsPage } from 'components/links';

export type TestRunTab = 'Overview' | 'Detailed';

export function testRunTabDescription(text: TestRunTab) {
    switch (text) {
        case 'Overview': {
            return 'an Overview of your Test Run';
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
}): ReactNode {
    const toLoad = Boolean(properties.toLoad);
    return (
        <Group align="center" mb="xs">
            <Breadcrumbs mb={4}>
                <Anchor size="sm" href={runsPage()}>
                    Runs
                </Anchor>
                <Text size="sm">
                    {toLoad ? '..--..' : properties.projectName}
                </Text>
                <Menu trigger="click-hover">
                    <Menu.Target>
                        <Text>
                            {properties.where}
                            <sub>
                                <IconCaretDown
                                    size=".6rem"
                                    style={{ marginTop: rem(13) }}
                                />
                            </sub>
                        </Text>
                    </Menu.Target>
                    <MenuDropdown>
                        <Menu.Item leftSection={<IconRipple size=".9rem" />}>
                            Overview
                        </Menu.Item>
                        {/* <Menu.Label>Detailed View</Menu.Label>
                        <Menu.Item leftSection={<IconTable size=".9rem" />}>
                            Table view
                        </Menu.Item>
                        <Menu.Item
                            leftSection={<IconBinaryTree2 size=".9rem" />}
                        >
                            Tree view
                        </Menu.Item> */}
                    </MenuDropdown>
                </Menu>
            </Breadcrumbs>
            <Text size="xs">{testRunTabDescription(properties.where)}</Text>
        </Group>
    );
}

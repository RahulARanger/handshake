import {
    Anchor,
    Breadcrumbs,
    Button,
    ButtonGroup,
    Group,
    Menu,
    MenuDropdown,
    rem,
    Text,
} from '@mantine/core';
import {
    IconBinaryTree2,
    IconCaretDown,
    IconMountain,
    IconRipple,
    IconTable,
} from '@tabler/icons-react';
import RelativeDate from 'components/timings/relative-date';
import type { Dayjs } from 'dayjs';
import type { ReactNode } from 'react';
import React from 'react';

export default function Header(properties: {
    inOverview?: boolean;
    date: Dayjs;
    projectName: string;
}): ReactNode {
    return (
        <Group justify="space-between" align="center">
            <Group align="center" mb="xs">
                <Breadcrumbs mb={4}>
                    <Anchor size="sm">Runs</Anchor>
                    <Text size="sm">{properties.projectName}</Text>
                    <Menu trigger="click-hover">
                        <Menu.Target>
                            <Button
                                size="xs"
                                variant="subtle"
                                p="1"
                                rightSection={
                                    <IconCaretDown
                                        size=".69rem"
                                        style={{ marginTop: rem(5.5) }}
                                    />
                                }
                            >
                                {properties.inOverview
                                    ? 'Overview'
                                    : 'Detailed'}
                            </Button>
                        </Menu.Target>
                        <MenuDropdown>
                            <Menu.Item
                                leftSection={<IconRipple size=".9rem" />}
                            >
                                Overview
                            </Menu.Item>
                            <Menu.Label>Test Entities</Menu.Label>
                            <Menu.Item leftSection={<IconTable size=".9rem" />}>
                                Table view
                            </Menu.Item>
                            <Menu.Item
                                leftSection={<IconBinaryTree2 size=".9rem" />}
                            >
                                Tree view
                            </Menu.Item>
                        </MenuDropdown>
                    </Menu>
                </Breadcrumbs>
                <Text size="xs">An Overview of your Test Results</Text>
            </Group>
            <Group align="center">
                <ButtonGroup mb={'xs'}>
                    <Button
                        leftSection={<IconRipple size=".9rem" />}
                        size="xs"
                        variant={
                            properties.inOverview ? 'light' : 'transparent'
                        }
                    >
                        Overview
                    </Button>
                    <Button
                        leftSection={<IconMountain size=".9rem" />}
                        size="xs"
                        variant={
                            properties.inOverview ? 'transparent' : 'light'
                        }
                    >
                        Detailed
                    </Button>
                </ButtonGroup>
                <RelativeDate date={properties.date} size="sm" />
            </Group>
        </Group>
    );
}

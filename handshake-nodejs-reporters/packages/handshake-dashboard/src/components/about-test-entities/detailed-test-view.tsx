import {
    ActionIcon,
    Badge,
    Card,
    Center,
    Divider,
    Group,
    OptionalPortal,
    rem,
    ScrollAreaAutosize,
    Skeleton,
    Stack,
    Tabs,
    Text,
    Tooltip,
} from '@mantine/core';
import React from 'react';
import type { ReactNode } from 'react';
import type { AssertionRecord, ImageRecord } from 'types/test-entity-related';
import { ErrorStack } from './error-card';
import {
    IconMaximize,
    IconMinimize,
    IconPhoto,
    IconTestPipe,
    IconX,
} from '@tabler/icons-react';
import type { ParsedTestRecord } from 'types/parsed-records';
import type { PreviewImageFeed } from './image-carousel';
import ImageCarousel, { NoThingsWereAdded } from './image-carousel';
import Assertions from './assertions';
import TextStyles from 'styles/text-styles.module.css';
import { useDisclosure } from '@mantine/hooks';

export const detailedTestViewPortalTarget = '#detailed-test-view';

export default function DetailedTestView(properties: {
    testID?: string;
    test: ParsedTestRecord;
    setImagePreview: (feed: PreviewImageFeed) => undefined;
    writtenAttachmentsForSuites?: ImageRecord[];
    attachmentsAreLoading?: boolean;
    simulateLoading?: boolean;
    assertions?: AssertionRecord[];
    setExpanded: (x: string | undefined) => void;
    assertionsAreLoading?: boolean;
}): ReactNode {
    const writtenAttachments = properties.writtenAttachmentsForSuites ?? [];
    const assertions = properties.assertions ?? [];

    const toLoad = !properties.testID;
    const iconStyle = { width: rem(12), height: rem(12) };
    const [expanded, handlers] = useDisclosure(false);
    const height = expanded ? undefined : 240;

    const loadNumber = <Skeleton radius="lg" w={20} height={18} />;

    return (
        <>
            <OptionalPortal
                target={detailedTestViewPortalTarget}
                withinPortal={expanded}
            >
                <Card
                    withBorder={!expanded}
                    shadow={expanded ? undefined : 'xl'}
                    p="sm"
                    m="xs"
                    radius={expanded ? 'sm' : 'xs'}
                >
                    <Stack gap={0}>
                        <Card.Section withBorder p="sm">
                            <Group justify="space-between">
                                <Tooltip
                                    label={properties.test.Title}
                                    color="orange"
                                >
                                    <Text
                                        size="sm"
                                        px="xs"
                                        className={TextStyles.breakable}
                                        lineClamp={1}
                                    >
                                        {properties.test.Title}
                                    </Text>
                                </Tooltip>
                                <ActionIcon
                                    variant="outline"
                                    onClick={() => {
                                        properties.setExpanded(
                                            expanded
                                                ? undefined
                                                : properties.testID,
                                        );
                                        handlers.toggle();
                                    }}
                                >
                                    {expanded ? (
                                        <IconMinimize style={iconStyle} />
                                    ) : (
                                        <IconMaximize style={iconStyle} />
                                    )}
                                </ActionIcon>
                            </Group>
                        </Card.Section>
                        <Card.Section withBorder p="sm">
                            <Tabs
                                variant="pills"
                                defaultValue={'images'}
                                h={'100%'}
                                orientation="vertical"
                                color="orange.9"
                            >
                                <Tabs.List justify="flex-start">
                                    <Tabs.Tab
                                        value="images"
                                        leftSection={
                                            <IconPhoto style={iconStyle} />
                                        }
                                        rightSection={
                                            properties.attachmentsAreLoading ? (
                                                loadNumber
                                            ) : (
                                                <Badge
                                                    color={'indigo.1'}
                                                    c="dark"
                                                    size="sm"
                                                    variant="filled"
                                                >
                                                    {writtenAttachments?.length ??
                                                        0}
                                                </Badge>
                                            )
                                        }
                                    >
                                        Images
                                    </Tabs.Tab>
                                    <Tabs.Tab
                                        value="assertions"
                                        leftSection={
                                            <IconTestPipe style={iconStyle} />
                                        }
                                        rightSection={
                                            properties.assertionsAreLoading ? (
                                                loadNumber
                                            ) : (
                                                <Badge
                                                    color="grape.3"
                                                    size="sm"
                                                    c="dark"
                                                    variant="filled"
                                                >
                                                    {assertions.length}
                                                </Badge>
                                            )
                                        }
                                    >
                                        Assertions
                                    </Tabs.Tab>
                                    <Tabs.Tab
                                        value="errors"
                                        leftSection={
                                            <IconX style={iconStyle} />
                                        }
                                        rightSection={
                                            toLoad ? (
                                                loadNumber
                                            ) : (
                                                <Badge
                                                    color="red.3"
                                                    size="sm"
                                                    c="dark"
                                                    variant="filled"
                                                >
                                                    {properties.test.errors
                                                        ?.length ?? 0}
                                                </Badge>
                                            )
                                        }
                                    >
                                        Errors
                                    </Tabs.Tab>
                                </Tabs.List>
                                <Divider mx={6} orientation="vertical" />
                                <Tabs.Panel value="images" h={height}>
                                    {writtenAttachments.length > 0 ? (
                                        <ImageCarousel
                                            height={height}
                                            images={writtenAttachments}
                                            onExpand={(_) =>
                                                properties.setImagePreview({
                                                    ..._,
                                                    title: `Images attached for test: ${properties.test.Title}`,
                                                })
                                            }
                                        />
                                    ) : (
                                        <NoThingsWereAdded
                                            message={
                                                properties.attachmentsAreLoading
                                                    ? 'Loading Images...'
                                                    : undefined
                                            }
                                        />
                                    )}
                                </Tabs.Panel>
                                <Tabs.Panel value="assertions" h={height}>
                                    {assertions.length > 0 ? (
                                        <ScrollAreaAutosize h={height}>
                                            <Assertions
                                                assertions={assertions}
                                            />
                                        </ScrollAreaAutosize>
                                    ) : (
                                        <NoThingsWereAdded
                                            message={
                                                properties.assertionsAreLoading
                                                    ? 'Checking if assertions are found for this test...'
                                                    : 'No Assertions were added'
                                            }
                                        />
                                    )}
                                </Tabs.Panel>
                                <Tabs.Panel value="errors" h={height}>
                                    {properties.test.errors.length > 0 ? (
                                        <ScrollAreaAutosize h={height}>
                                            <ErrorStack
                                                errors={properties.test.errors}
                                            />
                                        </ScrollAreaAutosize>
                                    ) : (
                                        <NoThingsWereAdded
                                            message={
                                                toLoad
                                                    ? 'Checking if errors are found for this test...'
                                                    : 'No Errors were found'
                                            }
                                            c={toLoad ? 'yellow' : 'green'}
                                        />
                                    )}
                                </Tabs.Panel>
                            </Tabs>
                        </Card.Section>
                    </Stack>
                </Card>
            </OptionalPortal>
            {expanded ? <Center>Expanded for your convenience</Center> : <></>}
        </>
    );
}

import type { CarouselProps } from '@mantine/carousel';
import { Carousel } from '@mantine/carousel';
import type { ImageProps, PaperProps, TextProps } from '@mantine/core';
import {
    ActionIcon,
    Box,
    Card,
    Center,
    Drawer,
    Group,
    Image,
    Modal,
    Paper,
    rem,
    Text,
    Tooltip,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconInfoCircle, IconMaximize } from '@tabler/icons-react';
import type { ReactNode } from 'react';
import React, { useState } from 'react';
import type { ImageRecord } from 'types/test-entity-related';

export interface PreviewImageFeed {
    images: ImageRecord[];
    index: number;
    title: string;
}

export default function ImageCarousel(properties: {
    height?: ImageProps['h'];
    index?: number;
    images: ImageRecord[];
    onExpand?: (_: PreviewImageFeed) => undefined;
    onChange?: CarouselProps['onSlideChange'];
}) {
    const slides = properties.images.map((image, index) => {
        const imageComp = (
            <Image
                radius="md"
                src={image.url}
                w="100%"
                p={0}
                h={properties.height}
                alt={image?.description}
                fallbackSrc="https://placehold.co/600x400?text=Attachment"
            />
        );
        return (
            <Carousel.Slide key={image.url}>
                {properties.onExpand ? (
                    <Card withBorder shadow="lg" mx="xs" radius="md">
                        <Tooltip label={image.description}>
                            <Card.Section withBorder p="sm">
                                <Text size="sm">{image.title}</Text>
                            </Card.Section>
                        </Tooltip>
                        <Card.Section p="sm" withBorder>
                            {imageComp}
                            <ActionIcon
                                variant="white"
                                size="sm"
                                style={{
                                    position: 'absolute',
                                    right: '9px',
                                    top: '52px',
                                }}
                                onClick={() =>
                                    properties.onExpand &&
                                    properties.onExpand({
                                        images: properties.images,
                                        index,
                                        title: '',
                                    })
                                }
                            >
                                <IconMaximize
                                    style={{
                                        width: rem(16),
                                        height: rem(16),
                                    }}
                                    stroke={2.5}
                                />
                            </ActionIcon>
                        </Card.Section>
                    </Card>
                ) : (
                    <Box>{imageComp}</Box>
                )}
            </Carousel.Slide>
        );
    });

    return (
        <Carousel
            align="start"
            withIndicators
            slideSize={
                properties.onExpand
                    ? Math.min(properties.images.length, 3)
                    : '100%'
            }
            initialSlide={properties.index ?? 0}
            onSlideChange={properties.onChange}
        >
            {slides}
        </Carousel>
    );
}

export function EmptyScreen(properties: {
    message: string;
    c: TextProps['c'];
    h?: PaperProps['h'];
}) {
    return (
        <Paper h={properties.h ?? '100%'} radius="sm" withBorder shadow="xl">
            <Center h={'100%'}>
                <Text size="sm" c={properties.c}>
                    {properties.message}
                </Text>
            </Center>
        </Paper>
    );
}

export function NoAttachmentsAdded(properties: { h?: PaperProps['h'] }) {
    return (
        <EmptyScreen
            c="yellow"
            message="No Attachments were Added"
            h={properties.h}
        />
    );
}

export function ShowImage(properties: {
    onClose: () => void;
    feed?: PreviewImageFeed;
}): ReactNode {
    const [opened, { open, close }] = useDisclosure(false);
    const [pointToImage, setPointToImage] = useState<number>(
        properties.feed?.index ?? 0,
    );
    return (
        <Modal
            onClose={properties.onClose}
            opened={properties.feed !== undefined}
            title={
                <Group justify="space-between">
                    {properties.feed?.title}
                    <ActionIcon
                        variant="default"
                        onClick={opened ? close : open}
                    >
                        <IconInfoCircle
                            style={{ width: rem(15), height: rem(15) }}
                        />
                    </ActionIcon>
                </Group>
            }
            radius={'md'}
            lockScroll
            overlayProps={{
                backgroundOpacity: 0.55,
                blur: 3,
            }}
            style={{ backgroundColor: 'transparent' }}
            fullScreen
        >
            <ImageCarousel
                images={properties.feed?.images ?? []}
                index={properties.feed?.index}
                onChange={(index) => setPointToImage(index)}
                height={'86vh'}
            />
            <Drawer
                opened={opened}
                onClose={close}
                position="bottom"
                size={'15%'}
                withOverlay={false}
                shadow="xl"
                title={
                    <Text>
                        {properties.feed?.images[pointToImage]?.description ??
                            'No Description was Added here'}
                    </Text>
                }
            />
        </Modal>
    );
}

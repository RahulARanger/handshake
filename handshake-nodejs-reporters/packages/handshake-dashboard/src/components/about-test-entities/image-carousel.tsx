import type { CarouselProps } from '@mantine/carousel';
import { Carousel } from '@mantine/carousel';
import type { ImageProps, PaperProps, TextProps } from '@mantine/core';
import {
    ActionIcon,
    Box,
    Center,
    Drawer,
    Group,
    Image,
    Modal,
    Paper,
    rem,
    Text,
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
                alt={`Loading Image: ${image.title}...`}
                fit={properties.onExpand ? 'cover' : 'contain'}
            />
        );

        return (
            <Carousel.Slide key={image.url}>
                {properties.onExpand ? (
                    <Box>
                        <Paper
                            withBorder
                            p="xs"
                            style={{
                                position: 'absolute',
                                left: '3px',
                                bottom: '-10px',
                                zIndex: 4,
                            }}
                        >
                            <Text size="sm" lineClamp={1}>
                                {image.title}
                            </Text>
                        </Paper>
                        {imageComp}
                        <ActionIcon
                            variant="light"
                            size="sm"
                            style={{
                                position: 'absolute',
                                right: '9px',
                                top: '10px',
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
                    </Box>
                ) : (
                    <Box>{imageComp}</Box>
                )}
            </Carousel.Slide>
        );
    });

    return (
        <Carousel
            align="start"
            withIndicators={properties.images.length > 1}
            withControls={properties.images.length > 1}
            slideSize={properties.onExpand ? '50%' : '100%'}
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
        <Paper
            h={properties.h ?? '100%'}
            radius="sm"
            withBorder
            shadow="xl"
            p="sm"
            miw={400}
        >
            <Center h={'100%'}>
                <Text size="sm" c={properties.c}>
                    {properties.message}
                </Text>
            </Center>
        </Paper>
    );
}

export function NoThingsWereAdded(properties: {
    h?: PaperProps['h'];
    message?: string;
    c?: PaperProps['c'];
}) {
    return (
        <EmptyScreen
            c={properties.c ?? 'yellow'}
            message={properties.message ?? 'No Attachments were Added'}
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

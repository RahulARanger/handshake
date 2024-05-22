import { Carousel } from '@mantine/carousel';
import type { ImageProps } from '@mantine/core';
import {
    ActionIcon,
    Card,
    Center,
    Image,
    Modal,
    Paper,
    rem,
    Text,
    Tooltip,
} from '@mantine/core';
import { IconMaximize } from '@tabler/icons-react';
import type { ReactNode } from 'react';
import React from 'react';
import type { ImageRecord } from 'types/test-entity-related';

export interface PreviewImageFeed {
    images: ImageRecord[];
    index: number;
}

export default function ImageCarousel(properties: {
    height?: ImageProps['h'];
    index?: number;
    images: ImageRecord[];
    onExpand?: (_: PreviewImageFeed) => undefined;
}) {
    const slides = properties.images.map((image, index) => (
        <Carousel.Slide key={image.url}>
            <Card withBorder shadow="lg" mx="xs" radius="md">
                <Tooltip label={image.description}>
                    <Card.Section withBorder p="sm">
                        <Text size="sm">{image.title}</Text>
                    </Card.Section>
                </Tooltip>
                <Card.Section p="sm" withBorder={!properties.onExpand}>
                    <Image
                        radius="md"
                        src={image.url}
                        w="100%"
                        p={0}
                        h={properties.height}
                        alt={image?.description}
                        fallbackSrc="https://placehold.co/600x400?text=Attachment"
                    />
                    {properties.onExpand ? (
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
                    ) : (
                        <></>
                    )}
                </Card.Section>
            </Card>
        </Carousel.Slide>
    ));

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
        >
            {slides}
        </Carousel>
    );
}

export function NoAttachmentsAdded() {
    return (
        <Paper withBorder shadow="lg" radius="sm" h="100%">
            <Center h="100%">
                <Text c="yellow" size="sm">
                    No Attachments were Added
                </Text>
            </Center>
        </Paper>
    );
}

export function ShowImage(properties: {
    onClose: () => void;
    feed?: { images: ImageRecord[]; index: number };
}): ReactNode {
    const image = properties.feed?.images?.at(properties.feed.index);
    return (
        <Modal
            onClose={properties.onClose}
            opened={properties.feed !== undefined}
            size="lg"
            title={image?.title ?? ''}
            radius={'md'}
            lockScroll
        >
            <ImageCarousel
                images={properties.feed?.images ?? []}
                index={properties.feed?.index}
            />
        </Modal>
    );
}

import { Carousel } from '@mantine/carousel';
import type { ImageProps } from '@mantine/core';
import { Card, Center, Image, Paper, Text } from '@mantine/core';
import React from 'react';
import type { ImageRecord } from 'types/test-entity-related';

export default function ImageCarousel(properties: {
    height: ImageProps['h'];
    images: ImageRecord[];
}) {
    const slides = properties.images.map((image) => (
        <Carousel.Slide key={image.url}>
            <Card withBorder shadow="lg" mx="xs" radius="md">
                <Card.Section withBorder p="sm">
                    <Text size="sm">{image.title}</Text>
                </Card.Section>
                <Card.Section p="sm">
                    <Image
                        radius="md"
                        src={image.url}
                        w="100%"
                        h={properties.height}
                        fallbackSrc="https://placehold.co/600x400?text=Attachment"
                    />
                </Card.Section>
            </Card>
        </Carousel.Slide>
    ));

    return (
        <Carousel
            align="start"
            withIndicators
            slideSize={Math.min(properties.images.length, 3)}
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

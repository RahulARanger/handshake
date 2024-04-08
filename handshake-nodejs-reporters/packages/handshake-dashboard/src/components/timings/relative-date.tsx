import { Carousel } from '@mantine/carousel';
import type { TextProps } from '@mantine/core';
import { rem, Text } from '@mantine/core';
import type { Dayjs } from 'dayjs';
import type { ReactNode } from 'react';
import React from 'react';
import relativeTime from 'dayjs/plugin/relativeTime';
import dayjs from 'dayjs';
import { useRef } from 'react';
import Autoplay from 'embla-carousel-autoplay';
import advancedFormat from 'dayjs/plugin/advancedFormat';
import { dateFormatUsed } from './format';

dayjs.extend(advancedFormat);
dayjs.extend(relativeTime);

export default function RelativeDate(properties: {
    date: Dayjs;
    size?: TextProps['size'];
}): ReactNode {
    const autoplay = useRef(Autoplay({ delay: 3e3 }));

    return (
        <Carousel
            withControls={false}
            align="start"
            loop
            height={rem(31)}
            slideSize="100%"
            orientation="vertical"
            plugins={[autoplay.current]}
            onMouseEnter={autoplay.current.stop}
            onMouseLeave={autoplay.current.reset}
        >
            <Carousel.Slide>
                <Text size={properties.size ?? 'sm'}>
                    {properties.date.format(dateFormatUsed)}
                </Text>
            </Carousel.Slide>
            <Carousel.Slide>
                <Text size={properties.size ?? 'sm'}>
                    {properties.date.fromNow()}
                </Text>
            </Carousel.Slide>
        </Carousel>
    );
}

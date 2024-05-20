import { Carousel } from '@mantine/carousel';
import type { TextProps } from '@mantine/core';
import { rem, Text, Tooltip } from '@mantine/core';
import type { Dayjs } from 'dayjs';
import type { ReactNode } from 'react';
import React from 'react';
import relativeTime from 'dayjs/plugin/relativeTime';
import dayjs from 'dayjs';
import { useRef } from 'react';
import Autoplay from 'embla-carousel-autoplay';
import advancedFormat from 'dayjs/plugin/advancedFormat';
import { dateFormatUsed, timeFormatUsed } from './format';

dayjs.extend(advancedFormat);
dayjs.extend(relativeTime);

export default function RelativeDate(properties: {
    date: Dayjs;
    relativeFrom?: Dayjs;
    size?: TextProps['size'];
    showTime?: boolean;
    height?: number;
    prefix?: string;
    relativeAlias?: string;
}): ReactNode {
    const autoplay = useRef(Autoplay({ delay: 3e3 }));
    const preferredFormat = properties.showTime
        ? timeFormatUsed
        : dateFormatUsed;

    return (
        <Carousel
            withControls={false}
            align="start"
            loop
            height={rem(properties.height ?? 31)}
            slideSize="100%"
            orientation="vertical"
            plugins={[autoplay.current]}
            onMouseEnter={autoplay.current.stop}
            onMouseLeave={autoplay.current.reset}
        >
            <Carousel.Slide style={{ display: 'flex', alignItems: 'center' }}>
                <Text size={properties.size ?? 'sm'}>
                    {(properties.prefix ?? '') +
                        properties.date.format(preferredFormat)}
                </Text>
            </Carousel.Slide>
            <Carousel.Slide style={{ display: 'flex', alignItems: 'center' }}>
                <Tooltip
                    label={`Relative from ${properties.relativeFrom ? properties.relativeFrom.format(preferredFormat) : dayjs().format(preferredFormat)} (${properties.relativeAlias ?? 'from now'})`}
                    color="pink"
                >
                    <Text size={properties.size ?? 'sm'}>
                        {properties.relativeFrom
                            ? properties.date.from(properties.relativeFrom)
                            : properties.date.fromNow()}
                    </Text>
                </Tooltip>
            </Carousel.Slide>
        </Carousel>
    );
}

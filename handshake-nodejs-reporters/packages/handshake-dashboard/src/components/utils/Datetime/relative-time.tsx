import Text from 'antd/lib/typography/Text';
import Tooltip from 'antd/lib/tooltip/index';
import dayjs, { type Dayjs } from 'dayjs';
import React, { useState, type CSSProperties, type ReactNode } from 'react';
import relativeTime from 'dayjs/plugin/relativeTime';
import duration from 'dayjs/plugin/duration';
import { type Duration } from 'dayjs/plugin/duration';
import advancedFormat from 'dayjs/plugin/advancedFormat';
import { timeFormatUsed } from './format';
import carouselStyles from '@/styles/carousel.module.css';
import Typography from 'antd/lib/typography/Typography';
import TextShadow from '@/styles/text-shadow.module.css';
import { LOCATORS } from 'handshake-utils';
import Carousel from 'antd/lib/carousel/index';

dayjs.extend(relativeTime);
dayjs.extend(duration);
dayjs.extend(advancedFormat);

export default function RelativeTo(properties: {
    dateTime: Dayjs;
    wrt?: Dayjs;
    secondDateTime?: Dayjs;
    format?: string;
    autoPlay?: boolean;
    style?: CSSProperties;
    prefix?: string;
    width?: string;
}): ReactNode {
    const formatter = (): string =>
        properties.wrt == undefined
            ? properties.dateTime.fromNow()
            : properties.dateTime.from(properties.wrt);

    const [formatted, setFormatted] = useState(formatter());

    const humanizedText = (properties.prefix ?? '') + formatted;
    return (
        <Carousel
            autoplay={properties.autoPlay}
            style={{
                fontWeight: 150,
                textAlign: 'center',
                width: properties.width ?? '200px',
                ...properties.style,
            }}
            swipeToSlide
            draggable
            dots={false}
            pauseOnHover
            className={`${carouselStyles.container} ${TextShadow.shinyShadow}`}
        >
            <Text
                className={`${LOCATORS.DAYS.relativeToRange}`}
                style={properties.style}
                ellipsis={{ tooltip: true }}
            >
                {`${properties.dateTime.format(
                    properties.format ?? timeFormatUsed,
                )} ${
                    properties.secondDateTime == undefined
                        ? ''
                        : ` - ${properties.secondDateTime.format(
                              properties.format ?? timeFormatUsed,
                          )}`
                }`}
            </Text>
            {properties.wrt == undefined ? (
                <span
                    onMouseEnter={() => {
                        setFormatted(formatter());
                    }}
                >
                    {humanizedText}
                </span>
            ) : (
                <Tooltip
                    title={`Relative to ${properties.wrt.format(
                        properties.format ?? timeFormatUsed,
                    )}`}
                >
                    {humanizedText}
                </Tooltip>
            )}
        </Carousel>
    );
}

export function RenderDuration(properties: {
    duration?: Duration;
    style?: CSSProperties;
    autoPlay?: boolean;
    width?: string;
    prefix?: string;
}): ReactNode {
    const simple = properties?.duration?.humanize();
    return (
        <Carousel
            autoplay={properties.autoPlay}
            style={{
                width: properties.width ?? '100px',
                textAlign: 'center',
                fontWeight: '150',
            }}
            swipeToSlide
            draggable
            dots={false}
            pauseOnHover
            className={`${carouselStyles.container} ${TextShadow.shinyShadow}`}
        >
            <DurationText duration={properties.duration} />
            <Typography suppressHydrationWarning className={'humanized'}>
                {simple ? `${properties.prefix ?? ''}${simple}` : '--'}
            </Typography>
        </Carousel>
    );
}

export function DurationText(properties: { duration?: Duration }): ReactNode {
    const seconds = properties?.duration?.asSeconds();
    return (
        <Typography
            suppressHydrationWarning
            className={`${LOCATORS.DAYS.duration}`}
        >
            {seconds === undefined
                ? `--`
                : `${seconds < 0 ? seconds * 100 : seconds} ${
                      seconds < 0 ? 'm' : ''
                  }s`}
        </Typography>
    );
}

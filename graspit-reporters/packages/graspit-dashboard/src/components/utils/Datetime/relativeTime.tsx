import Typography from 'antd/lib/typography/Typography';
import Tooltip from 'antd/lib/tooltip/index';
import dayjs, { type Dayjs } from 'dayjs';
import React, { useState, type CSSProperties, type ReactNode } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import Button from 'antd/lib/button/button';
import relativeTime from 'dayjs/plugin/relativeTime';
import duration from 'dayjs/plugin/duration';
import { type Duration } from 'dayjs/plugin/duration';
import advancedFormat from 'dayjs/plugin/advancedFormat';
import { timeFormatUsed } from './format';
import carouselStyles from 'src/styles/carousel.module.css';

dayjs.extend(relativeTime);
dayjs.extend(duration);
dayjs.extend(advancedFormat);

export default function RelativeTo(props: {
    dateTime: Dayjs;
    wrt?: Dayjs;
    secondDateTime?: Dayjs;
    format?: string;
    style?: CSSProperties;
}): ReactNode {
    const [emblaRef] = useEmblaCarousel({ loop: true }, [
        Autoplay({ stopOnInteraction: false }),
    ]);
    const formatter = (): string =>
        props.wrt != null
            ? props.dateTime.from(props.wrt)
            : props.dateTime.fromNow();
    const [formatted, setFormatted] = useState(formatter());

    return (
        <div
            className={carouselStyles.embla}
            ref={emblaRef}
            style={{ maxWidth: '120px', ...(props.style ?? {}) }}
        >
            <div suppressHydrationWarning className={carouselStyles.container}>
                <Typography className={carouselStyles.slide}>
                    {`${props.dateTime.format(
                        props.format ?? timeFormatUsed,
                    )} ${
                        props.secondDateTime != null
                            ? ` - ${props.secondDateTime.format(
                                  props.format ?? timeFormatUsed,
                              )}`
                            : ''
                    }`}
                </Typography>
                <Tooltip
                    title={
                        props.wrt != null
                            ? `Relative to ${props.wrt.format(
                                  props.format ?? timeFormatUsed,
                              )}`
                            : 'Click me to update!'
                    }
                    className={carouselStyles.slide}
                >
                    <Button
                        onClick={() => {
                            setFormatted(formatter());
                        }}
                        size="small"
                        type="text"
                    >
                        {formatted}
                    </Button>
                </Tooltip>
            </div>
        </div>
    );
}

export function HumanizeDuration(props: {
    duration?: Duration;
    style?: CSSProperties;
}): ReactNode {
    const [emblaRef] = useEmblaCarousel({ loop: true }, [
        Autoplay({ stopOnInteraction: false }),
    ]);
    return (
        <div
            className={carouselStyles.embla}
            ref={emblaRef}
            style={{
                maxWidth: '150px',
                minWidth: '100px',
                ...(props.style ?? {}),
            }}
        >
            <div suppressHydrationWarning className={carouselStyles.container}>
                <Typography className={carouselStyles.slide}>
                    {`${props?.duration?.asSeconds() ?? '--'} s`}
                </Typography>
                <Typography className={carouselStyles.slide}>
                    {props?.duration?.humanize() ?? '--'}
                </Typography>
            </div>
        </div>
    );
}

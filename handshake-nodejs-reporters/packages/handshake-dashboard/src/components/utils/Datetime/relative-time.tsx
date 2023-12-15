import Typography from 'antd/lib/typography/Typography';
import Tooltip from 'antd/lib/tooltip/index';
import dayjs, { type Dayjs } from 'dayjs';
import React, {
    useState,
    type CSSProperties,
    type ReactNode,
    useEffect,
} from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import relativeTime from 'dayjs/plugin/relativeTime';
import duration from 'dayjs/plugin/duration';
import { type Duration } from 'dayjs/plugin/duration';
import advancedFormat from 'dayjs/plugin/advancedFormat';
import { timeFormatUsed } from './format';
import carouselStyles from 'src/styles/carousel.module.css';

dayjs.extend(relativeTime);
dayjs.extend(duration);
dayjs.extend(advancedFormat);

export default function RelativeTo(properties: {
    dateTime: Dayjs;
    wrt?: Dayjs;
    secondDateTime?: Dayjs;
    format?: string;
    style?: CSSProperties;
}): ReactNode {
    const [emblaReference, emblaApi] = useEmblaCarousel({ loop: true }, [
        Autoplay({ stopOnInteraction: false }),
    ]);
    const [hover, setHover] = useState<boolean>(false);
    const formatter = (): string =>
        properties.wrt == undefined
            ? properties.dateTime.fromNow()
            : properties.dateTime.from(properties.wrt);

    const [formatted, setFormatted] = useState(formatter());
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
        if (!emblaApi) {
            return;
        }
        emblaApi.on('pointerUp', () => setHover(false));
        emblaApi.on('pointerDown', () => setHover(true));
    }, [setHover, emblaApi]);

    return (
        <div
            className={carouselStyles.embla}
            ref={emblaReference}
            style={{
                maxWidth: '120px',
                cursor: hover ? 'grabbing' : 'grab',
                ...properties.style,
            }}
        >
            <div suppressHydrationWarning className={carouselStyles.container}>
                <Typography className={carouselStyles.slide}>
                    {`${properties.dateTime.format(
                        properties.format ?? timeFormatUsed,
                    )} ${
                        properties.secondDateTime == undefined
                            ? ''
                            : ` - ${properties.secondDateTime.format(
                                  properties.format ?? timeFormatUsed,
                              )}`
                    }`}
                </Typography>
                {properties.wrt == undefined ? (
                    <span
                        className={carouselStyles.slide}
                        onMouseEnter={() => {
                            setFormatted(formatter());
                        }}
                    >
                        {isClient ? formatted : ''}
                    </span>
                ) : (
                    <Tooltip
                        title={`Relative to ${properties.wrt.format(
                            properties.format ?? timeFormatUsed,
                        )}`}
                        className={carouselStyles.slide}
                    >
                        {isClient ? formatted : ''}
                    </Tooltip>
                )}
            </div>
        </div>
    );
}

export function HumanizeDuration(properties: {
    duration?: Duration;
    style?: CSSProperties;
}): ReactNode {
    const [emblaReference, emblaApi] = useEmblaCarousel({ loop: true }, [
        Autoplay({ stopOnInteraction: false }),
    ]);
    const [hover, setHover] = useState<boolean>(false);

    useEffect(() => {
        if (!emblaApi) {
            return;
        }
        emblaApi.on('pointerUp', () => setHover(false));
        emblaApi.on('pointerDown', () => setHover(true));
    }, [setHover, emblaApi]);

    return (
        <div
            className={carouselStyles.embla}
            ref={emblaReference}
            style={{
                maxWidth: '150px',
                minWidth: '100px',
                cursor: hover ? 'grabbing' : 'grab',
                ...properties.style,
            }}
        >
            <div suppressHydrationWarning className={carouselStyles.container}>
                <Typography
                    suppressHydrationWarning
                    className={carouselStyles.slide}
                >
                    {`${
                        properties?.duration?.asSeconds().toFixed(2) ?? '--'
                    } s`}
                </Typography>
                <Typography
                    suppressHydrationWarning
                    className={carouselStyles.slide}
                >
                    {properties?.duration?.humanize() ?? '--'}
                </Typography>
            </div>
        </div>
    );
}

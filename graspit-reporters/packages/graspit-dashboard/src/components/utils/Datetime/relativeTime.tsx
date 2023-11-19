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

export default function RelativeTo(props: {
    dateTime: Dayjs;
    wrt?: Dayjs;
    secondDateTime?: Dayjs;
    format?: string;
    style?: CSSProperties;
}): ReactNode {
    const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [
        Autoplay({ stopOnInteraction: false }),
    ]);
    const [hover, setHover] = useState<boolean>(false);
    const formatter = (): string =>
        props.wrt != null
            ? props.dateTime.from(props.wrt)
            : props.dateTime.fromNow();

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
            ref={emblaRef}
            style={{
                maxWidth: '120px',
                cursor: hover ? 'grabbing' : 'grab',
                ...(props.style ?? {}),
            }}
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
                {props.wrt != null ? (
                    <Tooltip
                        title={`Relative to ${props.wrt.format(
                            props.format ?? timeFormatUsed,
                        )}`}
                        className={carouselStyles.slide}
                    >
                        {isClient ? formatted : ''}
                    </Tooltip>
                ) : (
                    <span
                        className={carouselStyles.slide}
                        onMouseEnter={() => {
                            setFormatted(formatter());
                        }}
                    >
                        {isClient ? formatted : ''}
                    </span>
                )}
            </div>
        </div>
    );
}

export function HumanizeDuration(props: {
    duration?: Duration;
    style?: CSSProperties;
}): ReactNode {
    const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [
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
            ref={emblaRef}
            style={{
                maxWidth: '150px',
                minWidth: '100px',
                cursor: hover ? 'grabbing' : 'grab',
                ...(props.style ?? {}),
            }}
        >
            <div suppressHydrationWarning className={carouselStyles.container}>
                <Typography
                    suppressHydrationWarning
                    className={carouselStyles.slide}
                >
                    {`${props?.duration?.asSeconds() ?? '--'} s`}
                </Typography>
                <Typography
                    suppressHydrationWarning
                    className={carouselStyles.slide}
                >
                    {props?.duration?.humanize() ?? '--'}
                </Typography>
            </div>
        </div>
    );
}

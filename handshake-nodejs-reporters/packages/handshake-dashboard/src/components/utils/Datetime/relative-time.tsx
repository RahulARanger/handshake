import Text from 'antd/lib/typography/Text';
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
import carouselStyles from '@/styles/carousel.module.css';
import Typography from 'antd/lib/typography/Typography';
import { LOCATORS } from 'handshake-utils';

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
}): ReactNode {
    const [emblaReference, emblaApi] = useEmblaCarousel({ loop: true }, [
        Autoplay({
            stopOnInteraction: false,
            active: properties.autoPlay ?? false,
        }),
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
                maxWidth: '167px',
                cursor: hover ? 'grabbing' : 'grab',
                ...properties.style,
            }}
        >
            <div suppressHydrationWarning className={carouselStyles.container}>
                <Text
                    className={`${carouselStyles.slide} ${LOCATORS.DAYS.relativeToRange}`}
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
    autoPlay?: boolean;
    maxWidth?: string;
}): ReactNode {
    const [emblaReference, emblaApi] = useEmblaCarousel({ loop: true }, [
        Autoplay({
            stopOnInteraction: false,
            active: properties?.autoPlay ?? false,
        }),
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
                maxWidth: properties.maxWidth ?? '110px',
                minWidth: '80px',
                textAlign: 'right',
                cursor: hover ? 'grabbing' : 'grab',
                ...properties.style,
            }}
        >
            <div suppressHydrationWarning className={carouselStyles.container}>
                <DurationText duration={properties.duration} />
                <Typography
                    suppressHydrationWarning
                    className={`${carouselStyles.slide} humanized`}
                >
                    {properties?.duration?.humanize() ?? '--'}
                </Typography>
            </div>
        </div>
    );
}

export function DurationText(properties: { duration?: Duration }): ReactNode {
    const seconds = properties?.duration?.asSeconds();
    return (
        <Typography
            suppressHydrationWarning
            className={`${carouselStyles.slide} ${LOCATORS.DAYS.duration}`}
        >
            {seconds === undefined
                ? `--`
                : `${seconds < 0 ? seconds * 100 : seconds} ${
                      seconds < 0 ? 'm' : ''
                  }s`}
        </Typography>
    );
}

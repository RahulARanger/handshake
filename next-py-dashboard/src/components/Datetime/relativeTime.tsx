import { Tooltip, Typography } from "@mui/material";
import dayjs, { type Dayjs } from "dayjs";
import React, { useState, type CSSProperties, type ReactNode } from "react";
import { formatTime } from "../parseUtils";
import useEmblaCarousel from "embla-carousel-react";
import carouselStyles from "@/styles/carousel.module.css";
import Autoplay from "embla-carousel-autoplay";
import relativeTime from "dayjs/plugin/relativeTime";
import duration from "dayjs/plugin/duration";
import { type Duration } from "dayjs/plugin/duration";
dayjs.extend(relativeTime);
dayjs.extend(duration);

export default function RelativeTime(props: {
    dateTime: Dayjs;
    wrt?: Dayjs;
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
            style={{ maxWidth: "150px", ...(props.style ?? {}) }}
        >
            <div className={carouselStyles.container}>
                <Typography className={carouselStyles.slide} variant="caption">
                    {formatTime(props.dateTime)}
                </Typography>
                <Typography className={carouselStyles.slide} variant="caption">
                    <Tooltip
                        title={
                            props.wrt != null
                                ? `Relative to ${formatTime(props.wrt)}`
                                : "Click me to update!"
                        }
                        onClick={() => {
                            setFormatted(formatter());
                        }}
                    >
                        <>{formatted}</>
                    </Tooltip>
                </Typography>
            </div>
        </div>
    );
}

export function HumanizeDuration(props: { duration?: Duration }): ReactNode {
    const [emblaRef] = useEmblaCarousel({ loop: true }, [
        Autoplay({ stopOnInteraction: false }),
    ]);
    return (
        <div
            className={carouselStyles.embla}
            ref={emblaRef}
            style={{ maxWidth: "150px" }}
        >
            <div className={carouselStyles.container}>
                <Typography className={carouselStyles.slide} variant="caption">
                    {`${props?.duration?.asSeconds() ?? "--"} s`}
                </Typography>
                <Typography className={carouselStyles.slide} variant="caption">
                    {props?.duration?.humanize() ?? "--"}
                </Typography>
            </div>
        </div>
    );
}

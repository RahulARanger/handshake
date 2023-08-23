import { Tooltip, Typography } from "@mui/material";
import { Dayjs } from "dayjs";
import React, { useState } from "react";
import { formatDateTime } from "../parseUtils";
import useEmblaCarousel from "embla-carousel-react";
import carouselStyles from "@/styles/carousel.module.css";
import Autoplay from "embla-carousel-autoplay";
import type { ReactNode } from "react";
import { CSSProperties } from "react";
import { Duration } from "dayjs/plugin/duration";

export default function RelativeTime(props: {
    dateTime: Dayjs;
    wrt?: Dayjs;
    style?: CSSProperties;
}): ReactNode {
    const [emblaRef] = useEmblaCarousel({ loop: true }, [
        Autoplay({ stopOnInteraction: false }),
    ]);
    const formatter = () =>
        props.wrt ? props.dateTime.from(props.wrt) : props.dateTime.fromNow();
    const [formatted, setFormatted] = useState(formatter());

    return (
        <div
            className={carouselStyles.embla}
            ref={emblaRef}
            style={{ maxWidth: "150px", ...(props.style ?? {}) }}
        >
            <div className={carouselStyles.container}>
                <Typography className={carouselStyles.slide} variant="caption">
                    {formatDateTime(props.dateTime)}
                </Typography>
                <Typography className={carouselStyles.slide} variant="caption">
                    <Tooltip
                        title={
                            props.wrt
                                ? `Relative to ${formatDateTime(props.wrt)}`
                                : "Click me to update!"
                        }
                        onClick={() => setFormatted(formatter())}
                    >
                        {formatted}
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
                    {props?.duration?.asSeconds() ?? "--"}
                </Typography>
                <Typography className={carouselStyles.slide} variant="caption">
                    {props?.duration?.humanize() ?? "--"}
                </Typography>
            </div>
        </div>
    );
}

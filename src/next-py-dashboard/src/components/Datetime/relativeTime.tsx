import { Tooltip, Typography } from "@mui/material";
import { Dayjs } from "dayjs";
import React, { useState } from "react";
import { formatDateTime } from "../parseUtils";
import useEmblaCarousel from "embla-carousel-react";
import carouselStyles from "@/styles/carousel.module.css";
import Autoplay from "embla-carousel-autoplay";
import type { ReactNode } from "react";

export default function RelativeTime(props: {
    dateTime: Dayjs;
    wrt?: Dayjs;
}): ReactNode {
    const [emblaRef] = useEmblaCarousel({ loop: true }, [Autoplay()]);
    const formatter = () =>
        props.wrt ? props.dateTime.from(props.wrt) : props.dateTime.fromNow();
    const [formatted, setFormatted] = useState(formatter());

    return (
        <div className={carouselStyles.embla} ref={emblaRef}>
            <div className={carouselStyles.container}>
                <Typography className={carouselStyles.slide} variant="caption">
                    {formatDateTime(props.dateTime)}
                </Typography>
                <Typography className={carouselStyles.slide} variant="caption">
                    <Tooltip
                        title="Click me!"
                        onClick={() => setFormatted(formatter())}
                    >
                        {formatted}
                    </Tooltip>
                </Typography>
            </div>
        </div>
    );
}

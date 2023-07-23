import { type ReactNode } from "react";
import * as React from "react";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import KeyboardArrowLeft from "@mui/icons-material/KeyboardArrowLeft";
import KeyboardArrowRight from "@mui/icons-material/KeyboardArrowRight";
import useEmblaCarousel from "embla-carousel-react";

export default function CarouselComponent(): ReactNode {
    const [emblaRef] = useEmblaCarousel();
    return (
        <Paper className="embla" ref={emblaRef}>
            <div className="embla__container"></div>
        </Paper>
    );
}

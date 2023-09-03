import { type ReactNode } from "react";
import * as React from "react";
import useEmblaCarousel from "embla-carousel-react";
import GraphCard from "./graphCard";

export default function CarouselComponent(): ReactNode {
    const [emblaRef] = useEmblaCarousel();
    return (
        <div className="embla" ref={emblaRef} style={{ height: "100%" }}>
            <div className="embla__container">
                <div className="embla__slide">
                    <GraphCard sx={{ minHeight: "163px" }}>
                        Attachments coming soon...
                    </GraphCard>
                </div>
            </div>
        </div>
    );
}

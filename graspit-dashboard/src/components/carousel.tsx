import { type ReactNode } from "react";
import * as React from "react";
import useEmblaCarousel from "embla-carousel-react";
import Card from "antd/lib/card/Card";
import Alert from "antd/lib/alert/Alert";

export default function CarouselComponent(): ReactNode {
    const [emblaRef] = useEmblaCarousel();
    return (
        <div className="embla" ref={emblaRef} style={{ height: "100%" }}>
            <div className="embla__container">
                <div className="embla__slide">
                    <Card style={{ minWidth: "300px", minHeight: "150px" }}>
                        <Alert
                            type="info"
                            message="Attachments are coming soon..."
                            showIcon
                        />
                    </Card>
                </div>
            </div>
        </div>
    );
}

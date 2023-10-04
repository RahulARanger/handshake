import React, { type ReactNode } from "react";
import carouselStyles from "@/styles/carousel.module.css";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import {
    type Attachment,
    type AttachmentContent,
} from "@/types/detailedTestRunPage";
import Image from "antd/lib/image";
import Paragraph from "antd/lib/typography/Paragraph";
import Text from "antd/lib/typography/Text";
import Card from "antd/lib/card/Card";
import Meta from "antd/lib/card/Meta";
import Ribbon from "antd/lib/badge/Ribbon";
import Tooltip from "antd/lib/tooltip/index";

export default function ImagesWithThumbnail(props: {
    images: Attachment[];
    loop?: boolean;
    maxHeight?: string;
    hideDesc?: boolean;
}): ReactNode {
    const [emblaRef] = useEmblaCarousel(
        {
            loop: props.loop,
            align: "center",
            dragFree: true,
        },
        [Autoplay({})],
    );
    return (
        <div className={carouselStyles.embla} ref={emblaRef}>
            <div className={carouselStyles.container}>
                {props.images.map((image, index) => {
                    const content: AttachmentContent = JSON.parse(
                        image.attachmentValue,
                    );

                    return (
                        <Card
                            title={
                                <Tooltip title={content.title}>
                                    <Text
                                        style={{ maxWidth: "350px" }}
                                        suppressHydrationWarning
                                    >
                                        {content.title}
                                    </Text>
                                </Tooltip>
                            }
                            key={index}
                            bordered
                            type="inner"
                            size="small"
                            hoverable
                            style={{ margin: "6px" }}
                        >
                            <Ribbon
                                placement="start"
                                color="orange-inverse"
                                text={index + 1}
                            >
                                <Image
                                    height={"95%"}
                                    style={{
                                        maxHeight: props.maxHeight ?? "250px",
                                    }}
                                    width={"95%"}
                                    alt="Screenshot attached"
                                    src={`data:image/${image.type.toLowerCase()};base64, ${
                                        content.value
                                    }`}
                                />
                            </Ribbon>

                            {props.hideDesc === true ? (
                                <> </>
                            ) : (
                                <Meta
                                    style={{ marginTop: "4px" }}
                                    description={
                                        <Paragraph
                                            ellipsis={{
                                                rows: 2,
                                                expandable: true,
                                            }}
                                        >
                                            {image.description}
                                        </Paragraph>
                                    }
                                />
                            )}
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}

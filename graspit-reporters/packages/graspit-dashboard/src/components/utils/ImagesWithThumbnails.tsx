import React, { type ReactNode } from 'react';
import carouselStyles from '../../styles/carousel.module.css';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import type {
    Attachment,
    AttachmentContent,
} from 'src/types/testEntityRelated';
import Image from 'antd/lib/image';
import Paragraph from 'antd/lib/typography/Paragraph';
import Text from 'antd/lib/typography/Text';
import Card from 'antd/lib/card/Card';
import Meta from 'antd/lib/card/Meta';
import Ribbon from 'antd/lib/badge/Ribbon';
import Tooltip from 'antd/lib/tooltip/index';

export function CardForAImage(props: {
    image: Attachment;
    index: number;
    maxHeight?: string;
    hideDesc?: boolean;
    isRaw?: boolean;
}) {
    const image = props.image;
    const content: AttachmentContent = JSON.parse(image.attachmentValue);

    const rawImage = !props.isRaw ? (
        <Ribbon placement="start" color="orange-inverse" text={props.index + 1}>
            <Image
                height={'95%'}
                style={{
                    maxHeight: props.maxHeight ?? '250px',
                }}
                width={'95%'}
                alt="Screenshot attached"
                src={`data:image/${image.type.toLowerCase()};base64, ${
                    content.value
                }`}
            />
        </Ribbon>
    ) : (
        <Image src={content.value} />
    );

    const desc =
        props.hideDesc === true ? (
            <> </>
        ) : (
            <Meta
                style={{ marginTop: '4px' }}
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
        );

    return (
        <Card
            title={
                <Tooltip title={content.title}>
                    <Text
                        style={{ maxWidth: '350px' }}
                        suppressHydrationWarning
                    >
                        {content.title}
                    </Text>
                </Tooltip>
            }
            bordered
            type="inner"
            size="small"
            hoverable
            className={carouselStyles.slide}
            style={{ margin: '6px' }}
        >
            {rawImage}
            {desc}
        </Card>
    );
}

export default function GalleryOfImages(props: {
    loop?: boolean;
    children: ReactNode[];
}): ReactNode {
    const [emblaRef] = useEmblaCarousel(
        {
            loop: props.loop,
            align: 'center',
            dragFree: true,
        },
        [Autoplay({})],
    );
    return (
        <div className={carouselStyles.embla} ref={emblaRef}>
            <div className={carouselStyles.container}>{props.children}</div>
        </div>
    );
}

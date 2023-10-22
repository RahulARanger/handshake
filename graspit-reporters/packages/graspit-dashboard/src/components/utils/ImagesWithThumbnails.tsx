import React, { type ReactNode } from 'react';
import carouselStyles from '../../styles/carousel.module.css';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import Image from 'antd/lib/image';
import Paragraph from 'antd/lib/typography/Paragraph';
import Text from 'antd/lib/typography/Text';
import Card from 'antd/lib/card/Card';
import Meta from 'antd/lib/card/Meta';
import Ribbon from 'antd/lib/badge/Ribbon';
import Tooltip from 'antd/lib/tooltip/index';

export function CardForAImage(props: {
    url: string;
    title: string;
    desc?: string;
    index?: number;
    maxHeight?: string;
}) {
    const rawImage =
        props.index != null ? (
            <Ribbon
                placement="start"
                color="orange-inverse"
                text={props.index + 1}
            >
                <Image
                    height={'95%'}
                    style={{
                        maxHeight: props.maxHeight ?? '250px',
                        objectFit: 'cover',
                        objectPosition: 'top',
                    }}
                    width={'95%'}
                    alt={`Image Attached: ${props.title}`}
                    src={props.url}
                />
            </Ribbon>
        ) : (
            <Image src={props.url} />
        );

    const desc =
        props.desc == null ? (
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
                        {props.desc}
                    </Paragraph>
                }
            />
        );

    return (
        <Card
            title={
                <Tooltip title={props.title}>
                    <Text
                        style={{ maxWidth: '350px' }}
                        suppressHydrationWarning
                    >
                        {props.title}
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
    maxWidth?: string;
}): ReactNode {
    const [emblaRef] = useEmblaCarousel(
        {
            loop: props.loop,
            align: 'center',
        },
        [Autoplay({})],
    );
    return (
        <div
            className={carouselStyles.embla}
            ref={emblaRef}
            style={{ maxWidth: props.maxWidth }}
        >
            <div className={carouselStyles.container}>{props.children}</div>
        </div>
    );
}

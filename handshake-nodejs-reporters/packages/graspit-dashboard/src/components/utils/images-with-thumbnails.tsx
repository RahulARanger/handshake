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

export function CardForAImage(properties: {
    url: string;
    title: string;
    desc?: string;
    index?: number;
    maxHeight?: string;
}) {
    const rawImage =
        properties.index == undefined ? (
            <Image src={properties.url} />
        ) : (
            <Ribbon
                placement="start"
                color="orange-inverse"
                text={properties.index + 1}
            >
                <Image
                    height={'95%'}
                    style={{
                        maxHeight: properties.maxHeight ?? '250px',
                        objectFit: 'cover',
                        objectPosition: 'top',
                    }}
                    width={'95%'}
                    alt={`Image Attached: ${properties.title}`}
                    src={properties.url}
                />
            </Ribbon>
        );

    const desc =
        properties.desc == undefined ? (
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
                        {properties.desc}
                    </Paragraph>
                }
            />
        );

    return (
        <Card
            title={
                <Tooltip title={properties.title}>
                    <Text
                        style={{ maxWidth: '350px' }}
                        suppressHydrationWarning
                    >
                        {properties.title}
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

export default function GalleryOfImages(properties: {
    loop?: boolean;
    children: ReactNode[];
    maxWidth?: string;
}): ReactNode {
    const [emblaReference] = useEmblaCarousel(
        {
            loop: properties.loop,
            align: 'center',
        },
        [Autoplay({})],
    );
    return (
        <div
            className={carouselStyles.embla}
            ref={emblaReference}
            style={{ maxWidth: properties.maxWidth }}
        >
            <div className={carouselStyles.container}>
                {properties.children}
            </div>
        </div>
    );
}

import React, { type ReactNode } from 'react';
import carouselStyles from '../../styles/carousel.module.css';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import Image from 'antd/lib/image';
import Paragraph from 'antd/lib/typography/Paragraph';
import Text from 'antd/lib/typography/Text';
import Card from 'antd/lib/card/Card';
import Meta from 'antd/lib/card/Meta';
import Tooltip from 'antd/lib/tooltip/index';
import PreviewGroup from 'antd/lib/image/PreviewGroup';

export function PlainImage(properties: {
    title: string;
    url: string;
    maxHeight?: string;
    isPlain?: boolean;
    id?: string;
    desc?: string;
}) {
    const image = (
        <Image
            height={'95%'}
            style={{
                maxHeight: properties.maxHeight ?? '250px',
                objectFit: 'cover',
                objectPosition: 'top',
                border: '1px solid grey',
            }}
            width={'95%'}
            alt={`Image Attached: ${properties.title}`}
            src={properties.url}
            id={properties.id}
        />
    );

    if (properties.isPlain) {
        return <>{image}</>;
    }
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
            className={`${carouselStyles.slide}`}
            style={{ margin: '6px', backgroundColor: 'transparent' }}
        >
            {image}
            {desc}
        </Card>
    );
}

export default function GalleryOfImages(properties: {
    loop?: boolean;
    children: ReactNode[];
    maxWidth?: string;
    height?: string;
    dragFree?: boolean;
}): ReactNode {
    const [emblaReference] = useEmblaCarousel(
        {
            loop: properties.loop,
            align: 'center',
            axis: 'y',
            dragFree: properties.dragFree ?? true,
        },
        [Autoplay({ stopOnInteraction: true, active: properties.loop })],
    );

    return (
        <div
            className={carouselStyles.embla}
            ref={emblaReference}
            style={{ maxWidth: properties.maxWidth, userSelect: 'none' }}
        >
            <div
                className={carouselStyles.container}
                style={{
                    flexDirection: 'column',
                    maxHeight: properties.height ?? '240px',
                    userSelect: 'none',
                }}
            >
                <PreviewGroup>
                    {properties.children.map((child, index) => (
                        <div className={carouselStyles.slide} key={index}>
                            {child}
                        </div>
                    ))}
                </PreviewGroup>
            </div>
        </div>
    );
}

export function GalleryOfImagesLeftToRight(properties: {
    loop?: boolean;
    children: ReactNode[];
    maxWidth?: string;
    height?: string;
}): ReactNode {
    const [emblaReference] = useEmblaCarousel({
        loop: properties.loop,
        align: 'center',
        dragFree: true,
    });

    return (
        <div
            className={carouselStyles.embla}
            ref={emblaReference}
            style={{ maxWidth: properties.maxWidth, userSelect: 'none' }}
        >
            <div
                className={carouselStyles.container}
                style={{
                    maxHeight: properties.height ?? '240px',
                    userSelect: 'none',
                }}
            >
                {properties.children.map((child, index) => (
                    <div
                        className={carouselStyles.slide}
                        key={index}
                        style={{ flex: '0 0 75%' }}
                    >
                        {child}
                    </div>
                ))}
            </div>
        </div>
    );
}

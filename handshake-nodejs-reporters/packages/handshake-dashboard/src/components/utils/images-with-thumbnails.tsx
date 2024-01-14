import React, { useState, type ReactNode, useCallback, useEffect } from 'react';
import carouselStyles from '../../styles/carousel.module.css';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import Image from 'antd/lib/image';
import Paragraph from 'antd/lib/typography/Paragraph';
import Text from 'antd/lib/typography/Text';
import Card from 'antd/lib/card/Card';
import Meta from 'antd/lib/card/Meta';
import Tooltip from 'antd/lib/tooltip/index';
import { flushSync } from 'react-dom';
import PreviewGroup from 'antd/lib/image/PreviewGroup';

export function PlainImage(properties: {
    title: string;
    url: string;
    maxHeight?: string;
    isPlain?: boolean;
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
        />
    );

    if (properties.isPlain) {
        return <>{image}</>;
    }
    return (
        <Card
            size="small"
            type="inner"
            bordered
            hoverable
            style={{ margin: '2px', padding: '3px' }}
        >
            {image}
        </Card>
    );
}

export function CardForAImage(properties: {
    url: string;
    title: string;
    desc?: string;
    index?: number;
    maxHeight?: string;
}) {
    const rawImage = (
        <PlainImage
            title={properties.title}
            maxHeight={properties.maxHeight}
            url={properties.url}
        />
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
const numberWithinRange = (number: number, min: number, max: number): number =>
    Math.min(Math.max(number, min), max);

export default function GalleryOfImages(properties: {
    loop?: boolean;
    children: ReactNode[];
    maxWidth?: string;
    height?: string;
}): ReactNode {
    const factor = 4.2;
    const [tweenValues, setTweenValues] = useState<number[]>([]);
    const [emblaReference, emblaApi] = useEmblaCarousel(
        {
            loop: properties.loop,
            align: 'center',
            axis: 'y',
        },
        [Autoplay({ stopOnInteraction: true, active: properties.loop })],
    );

    const onScroll = useCallback(() => {
        if (!emblaApi) return;

        const engine = emblaApi.internalEngine();
        const scrollProgress = emblaApi.scrollProgress();

        const styles = emblaApi.scrollSnapList().map((scrollSnap, index) => {
            let diffToTarget = scrollSnap - scrollProgress;

            if (engine.options.loop) {
                for (const loopItem of engine.slideLooper.loopPoints) {
                    const target = loopItem.target();
                    if (index === loopItem.index && target !== 0) {
                        const sign = Math.sign(target);
                        if (sign === -1)
                            diffToTarget = scrollSnap - (1 + scrollProgress);
                        if (sign === 1)
                            diffToTarget = scrollSnap + (1 - scrollProgress);
                    }
                }
            }
            const tweenValue = 1 - Math.abs(diffToTarget * factor);
            return numberWithinRange(tweenValue, 0, 1);
        });
        setTweenValues(styles);
    }, [emblaApi, setTweenValues]);

    useEffect(() => {
        if (!emblaApi) return;
        onScroll();
        emblaApi.on('scroll', () => {
            flushSync(() => onScroll());
        });
        emblaApi.on('reInit', onScroll);
    }, [emblaApi, onScroll]);

    return (
        <div
            className={carouselStyles.embla}
            ref={emblaReference}
            style={{ maxWidth: properties.maxWidth, height: '100%' }}
        >
            <div
                className={carouselStyles.container}
                style={{
                    flexDirection: 'column',
                    maxHeight: properties.height ?? '240px',
                }}
            >
                <PreviewGroup>
                    {properties.children.map((child, index) => (
                        <div
                            className={carouselStyles.slide}
                            key={index}
                            style={{
                                ...(tweenValues.length > 0 && {
                                    opacity: tweenValues[index],
                                }),
                                flex: '0 0 50%',
                            }}
                        >
                            {child}
                        </div>
                    ))}
                </PreviewGroup>
            </div>
        </div>
    );
}

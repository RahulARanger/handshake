import React, { type ReactNode } from 'react';
import carouselStyles from 'styles/carousel.module.css';
import Image from 'antd/lib/image';
import Paragraph from 'antd/lib/typography/Paragraph';
import Text from 'antd/lib/typography/Text';
import Card from 'antd/lib/card/Card';
import Meta from 'antd/lib/card/Meta';
import Tooltip from 'antd/lib/tooltip/index';
import PreviewGroup from 'antd/lib/image/PreviewGroup';
import { Carousel } from 'antd/lib';
import CaretRightOutlined from '@ant-design/icons/CaretRightOutlined';
import CaretLeftOutlined from '@ant-design/icons/CaretLeftOutlined';

export function PlainImage(properties: {
    title: string;
    url: string;
    height?: string;
    isPlain?: boolean;
    id?: string;
    desc?: string;
}) {
    const image = (
        <Image
            height={'95%'}
            style={{
                height: properties.height ?? '100%',
                objectFit: 'cover',
                objectPosition: 'top',
                border: '1px solid grey',
                borderRadius: '10px',
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
    children: ReactNode[];
    width?: string;
    noLoop?: boolean;
    dragFree?: boolean;
    pics?: number;
}): ReactNode {
    return (
        <PreviewGroup>
            <Carousel
                draggable
                className={`${carouselStyles.container} smooth-box`}
                style={{
                    padding: '10px',
                    width: properties.width,
                }}
                infinite={!properties.noLoop}
                autoplay
                slidesToShow={properties.pics ?? 1.75}
                arrows={true}
                prevArrow={<CaretLeftOutlined />}
                nextArrow={<CaretRightOutlined />}
            >
                {properties.children}
            </Carousel>
        </PreviewGroup>
    );
}

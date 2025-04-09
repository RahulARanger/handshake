import { Text, type TextProps } from '@mantine/core';
import type { CSSProperties, ReactNode } from 'react';
import React from 'react';
import CountUp from 'react-countup';

export default function CountUpNumber(properties: {
    endNumber: number;
    maxDigitsOf?: number;
    prefix?: string;
    decimalPoints?: number;
    style?: CSSProperties;
    smallWhenZero?: boolean;
    suffix?: string;
    cn?: string;
    size?: TextProps['size'];
    avoideAnimation?: boolean;
}): ReactNode {
    const fontSize = `var(--text-fz, var(--mantine-font-size-${properties.size ?? (properties.smallWhenZero && properties.endNumber === 0 ? 'xs' : 'sm')}))`;
    const formatN = (n: number) =>
        `${properties.prefix ?? ''}${n
            .toString()
            .padStart(
                Math.floor(
                    Math.log10(properties.maxDigitsOf ?? properties.endNumber) +
                        1,
                ),
                '0',
            )}${properties.suffix ?? ''}`;

    return properties.avoideAnimation ? (
        <Text>{formatN(properties.endNumber)}</Text>
    ) : (
        <CountUp
            end={properties.endNumber}
            start={0}
            className={properties.cn}
            useIndianSeparators={true}
            style={{ fontSize, ...properties.style }}
            formattingFn={formatN}
            decimals={properties.decimalPoints ?? 0}
        />
    );
}

import type { CSSProperties, ReactNode } from 'react';
import React from 'react';
import CountUp from 'react-countup';

export default function CountUpNumber(properties: {
    endNumber: number;
    maxDigitsOf?: number;
    prefix?: string;
    decimalPoints?: number;
    style?: CSSProperties;
    suffix?: string;
    cn?: string;
}): ReactNode {
    return (
        <CountUp
            end={properties.endNumber}
            start={0}
            className={properties.cn}
            useIndianSeparators={true}
            style={properties.style}
            formattingFn={(n: number) =>
                `${properties.prefix ?? ''}${n
                    .toString()
                    .padStart(
                        Math.floor(
                            Math.log10(
                                properties.maxDigitsOf ?? properties.endNumber,
                            ) + 1,
                        ),
                        '0',
                    )}${properties.suffix ?? ''}`
            }
            decimals={properties.decimalPoints ?? 0}
        />
    );
}

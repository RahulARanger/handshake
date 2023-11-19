import Statistic from 'antd/lib/statistic/Statistic';
import type { CSSProperties } from 'react';
import React, { Component, type ReactNode } from 'react';
import CountUp from 'react-countup';

export default class Counter extends Component<
    {
        style?: CSSProperties;
        end: number;
        suffix?: string;
        prefix?: string;
        decimalPoints?: number;
        maxDigits?: number;
    },
    { start: number }
> {
    state: { start: number } = { start: 0 };

    render(): ReactNode {
        return (
            <CountUp
                start={this.state.start}
                end={this.props.end}
                useIndianSeparators={true}
                style={this.props.style}
                formattingFn={(n: number) =>
                    `${this.props.prefix ?? ''}${n
                        .toString()
                        .padStart(
                            Math.floor(
                                Math.log10(
                                    this.props.maxDigits ?? this.props.end,
                                ) + 1,
                            ),
                            '0',
                        )}${this.props.suffix ?? ''}`
                }
                decimals={this.props.decimalPoints ?? 0}
            />
        );
    }

    componentDidUpdate(
        prevProps: Readonly<{ end: number }>,
        prevState: Readonly<{ start: number }>,
    ): void {
        if (prevProps.end !== prevState.start)
            this.setState({ start: prevProps.end });
    }
}

export function StatisticNumber(props: {
    title?: string | ReactNode;
    end: number;
}): ReactNode {
    return (
        <Statistic
            title={props.title}
            value={props.end}
            formatter={() => <Counter end={props.end} />}
        />
    );
}
export const getColorCode = (value: number) => {
    const colors = [
        'red',
        '#ffcdd3',
        '#ffd180',
        'orange',
        '#ffecb3',
        'yellow',
        '#c8e6c9',
        'green',
    ];
    const expected = Math.floor(value / (100 / colors.length));
    return colors.at(expected >= colors.length ? -1 : expected);
};

export function StaticPercent(props: { percent: number }): ReactNode {
    return (
        <Counter
            end={props.percent}
            suffix={'%'}
            style={{ color: getColorCode(props.percent) }}
        />
    );
}

export const toolTipFormats = {
    backgroundColor: 'rgb(10, 10, 10)',
    borderColor: 'rgba(128,128,128,0.1)',
    borderWidth: 1,
    style: { color: 'white' },
};

import Statistic from 'antd/lib/statistic/Statistic';
import type { CSSProperties } from 'react';
import React, { Component, type ReactNode } from 'react';
import CountUp from 'react-countup';

export default class Counter extends Component<
    {
        style?: CSSProperties;
        end: number;
        suffix?: string;
        decimalPoints?: number;
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
                    `${n
                        .toString()
                        .padStart(
                            Math.floor(Math.log10(this.props.end) + 1),
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
    if (value >= 0 && value <= 25) {
        return '#FFCDD2'; // Light Red
    } else if (value > 25 && value <= 50) {
        return '#FFD180'; // Light Orange
    } else if (value > 50 && value <= 75) {
        return '#FFECB3'; // Light Yellow
    } else if (value > 75 && value <= 100) {
        return '#C8E6C9'; // Light Green
    }
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

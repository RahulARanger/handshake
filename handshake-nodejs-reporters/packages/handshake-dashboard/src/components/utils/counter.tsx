import Statistic from 'antd/lib/statistic/Statistic';
import type { CSSProperties } from 'react';
import React, { Component, type ReactNode } from 'react';
import CountUp from 'react-countup';
import type { TooltipComponentOption } from 'echarts/components';
import { Tooltip } from 'antd/lib';
export default class Counter extends Component<
    {
        style?: CSSProperties;
        end: number;
        suffix?: string;
        prefix?: string;
        decimalPoints?: number;
        maxDigits?: number;
        cssClassName?: string;
        title?: string;
    },
    { start: number }
> {
    state: { start: number } = { start: 0 };

    render(): ReactNode {
        return (
            <Tooltip title={this.props.title}>
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
                    className={this.props.cssClassName}
                />
            </Tooltip>
        );
    }

    componentDidUpdate(
        previousProperties: Readonly<{ end: number }>,
        previousState: Readonly<{ start: number }>,
    ): void {
        if (previousProperties.end !== previousState.start)
            this.setState({ start: previousProperties.end });
    }
}

export function StatisticNumber(properties: {
    title?: string | ReactNode;
    end: number;
}): ReactNode {
    return (
        <Tooltip title={properties.title}>
            <Statistic
                value={properties.end}
                formatter={() => <Counter end={properties.end} />}
            />
        </Tooltip>
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

export function StaticPercent(properties: { percent: number }): ReactNode {
    return (
        <Counter
            end={properties.percent}
            suffix={'%'}
            title="Number of Tests (rolled_up) / Total Number of tests"
            style={{
                color: getColorCode(properties.percent),
            }}
        />
    );
}

export const toolTipFormats: TooltipComponentOption = {
    backgroundColor: 'rgb(10, 10, 10)',
    borderColor: 'rgba(128,128,128,0.1)',
    borderWidth: 1,
    textStyle: { color: 'white', fontSize: '.69rem' },
};

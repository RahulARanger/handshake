import Statistic from 'antd/lib/statistic/Statistic';
import React, { Component, type ReactNode } from 'react';
import CountUp from 'react-countup';

export default class Counter extends Component<
    { end: number; suffix?: string; decimalPoints?: number },
    { start: number }
> {
    state: { start: number } = { start: 0 };

    render(): ReactNode {
        return (
            <CountUp
                start={this.state.start}
                end={this.props.end}
                useIndianSeparators={true}
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

export const toolTipFormats = {
    backgroundColor: 'rgb(10, 10, 10)',
    borderColor: 'rgba(128,128,128,0.1)',
    borderWidth: 1,
    style: { color: 'white' },
};

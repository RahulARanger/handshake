import React, { type ReactElement } from "react";
import { type PieProps, Sector, type SectorProps } from "recharts";

export interface ExtraPieProps {
    payload: { name: string; value: string };
    percent: number;
    cx: number;
    cy: number;
    innerRadius: number;
    outerRadius: number;
}

const renderActiveShape = (
    props: PieProps & SectorProps & ExtraPieProps
): ReactElement<SVGElement> => {
    const {
        cx,
        cy,
        innerRadius,
        outerRadius,
        startAngle,
        endAngle,
        fill,
        payload,
        percent,
    } = props;

    return (
        <g>
            <text x={cx} y={cy} dy={-10} textAnchor="middle" fill={fill}>
                {payload.name}
            </text>
            <text
                x={cx}
                y={cy}
                dy={10}
                textAnchor="middle"
                fill={"grey"}
                style={{ fontSize: ".69rem" }}
            >
                {`(${(percent * 1e2).toFixed(2)}%)`}
            </text>
            <text
                x={cx}
                y={cy}
                dy={30}
                textAnchor="middle"
                fill={"white"}
                style={{ fontSize: ".69rem" }}
            >
                {`${payload.value} Test cases`}
            </text>
            <Sector
                cx={cx}
                cy={cy}
                innerRadius={(innerRadius ?? 60) - 3}
                outerRadius={(outerRadius ?? 20) + 3}
                cornerRadius={1}
                startAngle={startAngle}
                endAngle={endAngle}
                fill={fill}
                scale={1.1}
            />
        </g>
    );
};

export default renderActiveShape;

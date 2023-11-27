import type { GradientColorObject } from 'highcharts';
import { REM } from 'next/font/google';
import * as echarts from 'echarts/core';
import type { TooltipComponentOption } from 'echarts/components';

export const serif = REM({
    subsets: ['latin'],
    weight: '300',
    adjustFontFallback: true,
});
export const skippedGradient: GradientColorObject = {
    linearGradient: { x1: 0, x2: 0, y1: 0, y2: 1 },
    stops: [
        [0, 'rgb(255, 255, 0)'], // Lightest Custom Yellow
        [0.4, 'rgb(204, 204, 0)'], // Medium Custom Yellow
        [0.7, 'rgb(153, 153, 0)'], // Dark Custom Yellow
        [0.9, 'rgb(102, 102, 0)'], // Darkest Custom Yellow
    ],
};

export const redGradient: GradientColorObject = {
    linearGradient: { x1: 0, x2: 0, y1: 0, y2: 1 },
    stops: [
        [0, 'rgb(255, 0, 0)'], // Lightest Custom Color
        [0.4, 'rgb(204, 0, 0)'], // Medium Cus  tom Color
        [0.7, 'rgb(153, 0, 0)'], // Dark Custom Color
        [0.9, 'rgb(102, 0, 0)'], // Darkest Custom Color
    ],
};

export const greenGradient: GradientColorObject = {
    linearGradient: { x1: 0, x2: 0, y1: 0, y2: 1 },
    stops: [
        [0, 'rgb(0, 255, 0)'], // Lightest Custom Green
        [0.4, 'rgb(0, 204, 0)'], // Medium Custom Green
        [0.7, 'rgb(0, 153, 0)'], // Dark Custom Green
        [0.9, 'rgb(0, 102, 0)'], // Darkest Custom Green
    ],
};

export const radiantGreen = new echarts.graphic.LinearGradient(0, 0, 0, 1, [
    { offset: 0, color: 'rgb(0, 102, 0)' }, // Lighter shade at the top
    { offset: 1, color: 'rgb(0, 153, 0)' }, // Darker shade at the bottom
]);

export const radiantRed = new echarts.graphic.LinearGradient(0, 0, 0, 1, [
    { offset: 0, color: '#FF0000' }, // Lighter shade at the top
    { offset: 1, color: '#800000' }, // Darker shade at the bottom
]);

export const radiantYellow = new echarts.graphic.LinearGradient(0, 0, 0, 1, [
    { offset: 0, color: '#FFFF00' }, // Lighter shade at the top
    { offset: 1, color: '#808000' }, // Darker shade at the bottom
]);

export const toolTipFormats: TooltipComponentOption = {
    backgroundColor: 'rgb(10, 10, 10)',
    borderColor: 'rgba(128,128,128,0.1)',
    borderWidth: 1,
    textStyle: {
        color: 'white',
        fontFamily: serif.style.fontFamily,
    },
};

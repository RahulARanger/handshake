import type { GradientColorObject } from 'highcharts';

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
        [0.4, 'rgb(204, 0, 0)'], // Medium Custom Color
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

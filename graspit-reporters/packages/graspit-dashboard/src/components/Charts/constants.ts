import type { GradientColorObject } from 'highcharts';

export const skippedGradient: GradientColorObject = {
    radialGradient: {
        cx: 0,
        cy: 0.5,
        r: 1.0,
    },
    stops: [
        [0.001, 'rgb(241, 241, 242)'], // Light Gray
        [1.002, 'rgb(224, 226, 228)'], // Gray
    ],
};

export const redGradient: GradientColorObject = {
    radialGradient: {
        cx: 0.1,
        cy: 0.2,
        r: 1.0,
    },
    stops: [
        [0, 'rgb(226, 37, 37)'], // Red
        [0.828, 'rgb(211, 49, 49)'], // Dark Red
    ],
};

export const greenGradient: GradientColorObject = {
    radialGradient: {
        cx: -0.01,
        cy: 0.575,
        r: 1.0,
    },
    stops: [
        [0, 'rgb(19, 170, 82)'], // Green
        [0.9, 'rgb(0, 102, 43)'], // Dark Green
    ],
};

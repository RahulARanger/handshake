import { REM } from 'next/font/google';
import * as echarts from 'echarts/core';
import type { TooltipComponentOption } from 'echarts/components';

export const serif = REM({
    subsets: ['latin'],
    weight: '300',
    adjustFontFallback: true,
});
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

export const radiantBlue = new echarts.graphic.LinearGradient(0, 0, 0, 1, [
    { offset: 0, color: '#ADD8E6' }, // Lighter shade at the top
    { offset: 1, color: '#87CEEB' }, // Darker shade at the bottom
]);

export const radiantOrange = new echarts.graphic.LinearGradient(0, 0, 0, 1, [
    { offset: 0, color: '#FFA500' }, // Lighter shade at the top
    { offset: 1, color: '#FF4500' }, // Darker shade at the bottom
]);

export const standingToGradientColors = {
    PASSED: radiantGreen,
    FAILED: radiantRed,
    SKIPPED: radiantYellow,
};

export const standingToColors = {
    PASSED: 'green',
    FAILED: 'red',
    RETRIED: 'orangered',
    PENDING: 'grey',
    SKIPPED: 'yellow',
};

export const toolTipFormats: TooltipComponentOption = {
    backgroundColor: 'rgba(255, 255, 255, .00001)', // Background color for the tooltip
    borderColor: 'grey',
    borderWidth: 1,
    textStyle: {
        color: 'white',
    },
    extraCssText:
        'backdrop-filter: blur(12px);' +
        'box-shadow: rgba(0, 0, 0, 0.4) 0px 2px 4px, ' + // Specified box shadow
        'rgba(0, 0, 0, 0.3) 0px 7px 13px -3px, ' +
        'rgba(0, 0, 0, 0.2) 0px -3px 0px inset;',
};

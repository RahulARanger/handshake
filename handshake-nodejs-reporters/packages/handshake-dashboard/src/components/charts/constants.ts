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
    backgroundColor: 'rgb(10, 10, 10)',
    borderColor: 'rgba(128,128,128,0.1)',
    borderWidth: 1,
    textStyle: {
        color: 'white',
    },
};

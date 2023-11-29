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

export const toolTipFormats: TooltipComponentOption = {
    backgroundColor: 'rgb(10, 10, 10)',
    borderColor: 'rgba(128,128,128,0.1)',
    borderWidth: 1,
    textStyle: {
        color: 'white',
        fontFamily: serif.style.fontFamily,
    },
};

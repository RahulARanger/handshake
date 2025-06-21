import type { Meta, StoryObj } from '@storybook/react';
import { generateSampleWrittenAttachment } from 'stories/TestData/test-case';
import ImageCarousel from './image-carousel';
import { Chance } from 'chance';

const meta = {
    title: 'AboutTestCase/ImageCarousel',
    component: ImageCarousel,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
    args: { height: 400 },
} satisfies Meta<typeof ImageCarousel>;

export default meta;
type Story = StoryObj<typeof meta>;

const generator = new Chance();

export const SingleImage: Story = {
    args: {
        images: [generateSampleWrittenAttachment()],
    },
};

export const NoImage: Story = {
    args: {
        images: [generateSampleWrittenAttachment({ no_image: true })],
    },
};

export const MultipleImages: Story = {
    args: {
        images: generator.n(generateSampleWrittenAttachment, 10),
        onExpand: () => {},
    },
};

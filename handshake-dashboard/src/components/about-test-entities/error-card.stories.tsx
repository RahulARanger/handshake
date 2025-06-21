import type { Meta, StoryObj } from '@storybook/react';
import ErrorCard from './error-card';
import { generateErrors } from 'stories/TestData/error';

const meta = {
    title: 'AboutTestCase/ErrorCard',
    component: ErrorCard,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
} satisfies Meta<typeof ErrorCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ErrorMessageWithStack: Story = {
    args: {
        error: generateErrors()[0],
    },
};

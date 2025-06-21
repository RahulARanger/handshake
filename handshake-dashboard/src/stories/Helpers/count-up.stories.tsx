import type { Meta, StoryObj } from '@storybook/react';
import CountUpNumber from 'components/counter';
// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
    title: 'Helpers/CountUpNumber',
    component: CountUpNumber,
    parameters: {
        // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
        layout: 'centered',
    },
    // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
    tags: ['autodocs'],
    // More on argTypes: https://storybook.js.org/docs/api/argtypes
    argTypes: {},
    // Use `fn` to spy on the onClick arg, which will appear in the actions panel once invoked: https://storybook.js.org/docs/essentials/actions#action-args
} satisfies Meta<typeof CountUpNumber>;

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const SimpleNumber: Story = {
    args: {
        endNumber: 10,
    },
};

export const LargeNumber: Story = {
    args: {
        endNumber: 10_000,
    },
};

export const NegativeNumber: Story = {
    args: {
        endNumber: -10_000,
    },
};

export const DecimalPlacesToInt: Story = {
    args: {
        endNumber: 69.696_969,
    },
};

export const DecimalPlaces: Story = {
    args: {
        endNumber: 69.696_969,
        decimalPoints: 3,
    },
};

import type { Meta, StoryObj } from '@storybook/react';
import { expect, fn, userEvent, within } from '@storybook/test';
import SwitchTestCases from 'components/test-case-switch';

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
    title: 'AboutTestRun/SwitchTestCases',
    component: SwitchTestCases,
    parameters: {
        // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
        layout: 'centered',
    },
    // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
    tags: ['autodocs'],
    // More on argTypes: https://storybook.js.org/docs/api/argtypes
    argTypes: {},
    // Use `fn` to spy on the onClick arg, which will appear in the actions panel once invoked: https://storybook.js.org/docs/essentials/actions#action-args
    args: { onChange: fn() },
} satisfies Meta<typeof SwitchTestCases>;

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Primary: Story = {
    args: {
        isDefaultTestCases: true,
    },
    play: async ({ canvasElement, step }) => {
        const screen = within(canvasElement);

        await step('testing the default value', async () => {
            await expect(screen.getByText('Tests')).toBeInTheDocument();
            await expect(screen.queryByText('Suites')).not.toBeInTheDocument();
            await userEvent.click(screen.getByRole('switch'));
            await expect(screen.queryByText('Tests')).not.toBeInTheDocument();
            await expect(screen.getByText('Suites')).toBeInTheDocument();
        });
    },
};

export const WithPrefix: Story = {
    args: {
        isDefaultTestCases: false,
        prefix: 'x-',
        trackWidth: 70,
    },
    play: async ({ canvasElement, step }) => {
        const screen = within(canvasElement);

        await step('testing the prefix value', async () => {
            await expect(screen.queryByText('x-Tests')).not.toBeInTheDocument();
            await expect(screen.getByText('x-Suites')).toBeInTheDocument();
            await userEvent.click(screen.getByRole('switch'));
            await expect(screen.getByText('x-Tests')).toBeInTheDocument();
            await expect(
                screen.queryByText('x-Suites'),
            ).not.toBeInTheDocument();
        });
    },
};

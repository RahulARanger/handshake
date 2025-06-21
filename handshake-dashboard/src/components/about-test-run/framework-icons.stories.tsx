import type { Meta, StoryObj } from '@storybook/react';
import { userEvent, within, expect } from '@storybook/test';
import { FrameworksUsed } from 'components/about-test-run/framework-icons';

const meta = {
    title: 'AboutTestRun/FrameworksUsed',
    component: FrameworksUsed,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
} satisfies Meta<typeof FrameworksUsed>;

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const MultipleFrameworksUsed: Story = {
    args: {
        frameworks: ['webdriverio', 'mocha', 'jasmine'],
    },
    play: async ({ canvasElement, step }) => {
        const screen = within(canvasElement);

        await step('testing the presence of all elements', async () => {
            await userEvent.click(screen.getByLabelText('webdriverio-avatar'));
            await userEvent.click(screen.getByLabelText('mocha-avatar'));
            await userEvent.click(screen.getByLabelText('jasmine-avatar'));
        });
    },
};

export const NoFrameworksUsed: Story = {
    args: {
        frameworks: [],
    },
    play: async ({ canvasElement, step }) => {
        const screen = within(canvasElement);

        await step(
            'testing the presence of avatar if no frameworks are mentioned',
            async () => {
                await userEvent.click(
                    screen.getByLabelText('no-framework-used-avatar'),
                );
            },
        );
    },
};

export const Pytest: Story = {
    args: {
        frameworks: ['pytest'],
    },
};

export const Webdriverio: Story = {
    args: {
        frameworks: ['webdriverio'],
    },
};

export const Mocha: Story = {
    args: {
        frameworks: ['mocha'],
    },
};

export const Cucumber: Story = {
    args: {
        frameworks: ['cucumber'],
    },
    play: async ({ canvasElement, step }) => {
        const screen = within(canvasElement);

        await step('testing the presence of cucumber avatar', async () => {
            await userEvent.click(screen.getByLabelText('cucumber-avatar'));
        });
    },
};

export const Jasmine: Story = {
    args: {
        frameworks: ['jasmine'],
    },
};

export const Unknown: Story = {
    args: {
        frameworks: ['unknown', 'unknown'],
    },
    play: async ({ canvasElement, step }) => {
        const screen = within(canvasElement);

        await step(
            'testing the presence of avatar if no frameworks are identified',
            async () => {
                await expect(
                    screen.getAllByLabelText('not-identified-framework-avatar'),
                ).toHaveLength(2);
            },
        );
    },
};

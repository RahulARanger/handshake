import type { Meta, StoryObj } from '@storybook/nextjs';
import PlatformEntity from './platform-entity';
import { userEvent, within } from 'storybook/test';

const meta = {
    title: 'AboutTestRun/PlatformEntity',
    component: PlatformEntity,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
} satisfies Meta<typeof PlatformEntity>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Chrome: Story = {
    args: {
        entityNames: ['Chrome'], // case-insensitive
    },
    play: async ({ canvasElement, step }) => {
        const screen = within(canvasElement);

        await step(
            'testing the version mentioned beside the icon',
            async () => {
                await userEvent.click(screen.getByLabelText(`chrome-platform`));
            },
        );
    },
};

export const FirefoxAndEdge: Story = {
    args: {
        entityNames: ['firefox', 'edge-headless-shell'], // we check for the keyword
    },
    play: async ({ canvasElement, step }) => {
        const screen = within(canvasElement);

        await step(
            'testing if we are finding platforms through keywords',
            async () => {
                await userEvent.click(
                    screen.getByLabelText(`firefox-platform`),
                );
                await userEvent.click(screen.getByLabelText(`edge-platform`));
            },
        );
    },
};

export const EdgeFirefoxChrome: Story = {
    args: {
        entityNames: [
            'chrome-headless-shell',
            'firefox-headless-shell',
            'edge-headless-shell',
        ],
    },
    play: async ({ canvasElement, step }) => {
        const screen = within(canvasElement);

        await step(
            'testing if we are finding platforms through keywords',
            async () => {
                await userEvent.click(
                    screen.getByLabelText(`firefox-platform`),
                );
                await userEvent.click(screen.getByLabelText(`edge-platform`));
                await userEvent.click(screen.getByLabelText(`chrome-platform`));
            },
        );
    },
};

export const NotYetRegistered: Story = {
    args: {
        entityNames: ['safari'],
    },
    play: async ({ canvasElement, step }) => {
        const screen = within(canvasElement);
        await step(
            'testing if we are allowing unknown keywords but we are showing a default avatar in that case',
            async () => {
                await userEvent.click(
                    screen.getByLabelText(`not-yet-noted-platform`),
                );
            },
        );
    },
};

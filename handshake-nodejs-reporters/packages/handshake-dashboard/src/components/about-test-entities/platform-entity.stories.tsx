import type { Meta, StoryObj } from '@storybook/react';
import PlatformEntity from './platform-entity';
import { userEvent, within, expect } from '@storybook/test';

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
        entityName: 'chrome',
        entityVersion: '123.0.0',
        simplified: 'chrome_v123.0.0',
    },
    play: async ({ canvasElement, step, args }) => {
        const screen = within(canvasElement);

        await step(
            'testing the version mentioned beside the icon',
            async () => {
                await userEvent.click(screen.getByLabelText(`chrome-platform`));
                await expect(
                    screen.getByLabelText('chrome-version'),
                ).toHaveTextContent(args.entityVersion);
            },
        );
    },
};

export const Firefox: Story = {
    args: {
        entityName: 'firefox',
        entityVersion: '123.0.0',
        simplified: 'firefox_v123.0.0',
    },
    play: async ({ canvasElement, step, args }) => {
        const screen = within(canvasElement);

        await step(
            'testing the version mentioned beside the icon',
            async () => {
                await userEvent.click(
                    screen.getByLabelText(`firefox-platform`),
                );
                await expect(
                    screen.getByLabelText('firefox-version'),
                ).toHaveTextContent(args.entityVersion);
            },
        );
    },
};

export const Edge: Story = {
    args: {
        entityName: 'edge',
        entityVersion: '123.0.0',
        simplified: 'edge_v123.0.0',
    },
    play: async ({ canvasElement, step, args }) => {
        const screen = within(canvasElement);

        await step(
            'testing the version mentioned beside the icon',
            async () => {
                await userEvent.click(screen.getByLabelText(`edge-platform`));
                await expect(
                    screen.getByLabelText('edge-version'),
                ).toHaveTextContent(args.entityVersion);
            },
        );
    },
};

export const NotYetRegistered: Story = {
    args: {
        entityName: 'safari',
        entityVersion: '123.0.0',
        simplified: 'safari_v123.0.0',
    },
    play: async ({ canvasElement, step, args }) => {
        const screen = within(canvasElement);

        await step(
            'testing the version mentioned beside the icon',
            async () => {
                await userEvent.click(
                    screen.getByLabelText(`not-yet-noted-platform`),
                );
                await expect(
                    screen.getByLabelText('safari-version'),
                ).toHaveTextContent(args.entityVersion);
            },
        );
    },
};

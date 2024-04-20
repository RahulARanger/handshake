import type { Meta, StoryObj } from '@storybook/react';
import PlatformEntity from './platform-entity';

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
};

export const Firefox: Story = {
    args: {
        entityName: 'firefox',
        entityVersion: '123.0.0',
        simplified: 'firefox_v123.0.0',
    },
};

export const Edge: Story = {
    args: {
        entityName: 'edge',
        entityVersion: '123.0.0',
        simplified: 'edge_v123.0.0',
    },
};

export const NotYetRegistered: Story = {
    args: {
        entityName: 'safari',
        entityVersion: '123.0.0',
        simplified: 'safari_v123.0.0',
    },
};

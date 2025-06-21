import type { Meta, StoryObj } from '@storybook/react';
import { Chance } from 'chance';
import CurrentLocation from 'components/about-test-run/current-location';

const meta = {
    title: 'AboutTestRun/Header',
    component: CurrentLocation,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
} satisfies Meta<typeof CurrentLocation>;

export default meta;
type Story = StoryObj<typeof meta>;

const generator = new Chance();

export const InOverviewTab: Story = {
    args: {
        projectName: generator.company(),
        where: 'Overview',
        toLoad: false,
    },
};

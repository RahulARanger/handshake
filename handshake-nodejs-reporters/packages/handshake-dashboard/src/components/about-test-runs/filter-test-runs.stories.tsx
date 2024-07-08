import type { Meta, StoryObj } from '@storybook/react';
import { expect, findAllByRole, findByRole, fn, within } from '@storybook/test';
import FilterBox, { optionsForDate } from './filter-test-runs';
import { randomTestProjects } from 'stories/TestData/test-runs';
import dayjs from 'dayjs';

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
    title: 'AboutTestRuns/FilterTestRuns',
    component: FilterBox,
    parameters: {
        // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
        layout: 'centered',
    },
    // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
    tags: ['autodocs'],
    // More on argTypes: https://storybook.js.org/docs/api/argtypes
    argTypes: {},
    args: { onDateRangeChange: fn(), onProjectFilterChange: fn() },
    // Use `fn` to spy on the onClick arg, which will appear in the actions panel once invoked: https://storybook.js.org/docs/essentials/actions#action-args
} satisfies Meta<typeof FilterBox>;

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const ProjectsDropdown: Story = {
    args: {
        setOfProjects: randomTestProjects(6),
        recentRunDate: dayjs(),
    },
    play: async ({ canvasElement, step, args }) => {
        const screen = within(canvasElement);
        const projectFilter = await screen.findByPlaceholderText(
            'Filter by Project Name',
        );

        await step('no default value must be selected', async () => {
            await expect(projectFilter).toBeInTheDocument();
            await expect(projectFilter).toHaveValue('');
        });

        await step('testing the presence of the project filters', async () => {
            projectFilter.click();
            const options = await findAllByRole(
                canvasElement.parentElement as HTMLElement,
                'option',
            );
            await expect(options.length).toBe(args.setOfProjects.length);

            await Promise.all(
                options.map(async (option, index) => {
                    await expect(option).toHaveTextContent(
                        args.setOfProjects[index],
                    );
                }),
            );
        });

        await step(
            'checking if the onProjectFilterChange should be called when option is selected',
            async ({ args }) => {
                const options = await findAllByRole(
                    canvasElement.parentElement as HTMLElement,
                    'option',
                );
                options[0].click();

                await expect(args.onProjectFilterChange).toHaveBeenCalledOnce();
                await expect(args.onProjectFilterChange).toHaveBeenCalledWith(
                    args.setOfProjects[0],
                );
            },
        );

        await step(
            'deselecting the project should also call onProjectFilterChange',
            async () => {
                const closeButton =
                    projectFilter.nextElementSibling?.querySelector(
                        'button[type=button]',
                    ) as HTMLButtonElement;
                closeButton.click();
                await expect(args.onProjectFilterChange).toHaveBeenCalled();
                await expect(
                    args.onProjectFilterChange,
                ).toHaveBeenLastCalledWith(null);
            },
        );
    },
};

export const WithSingleProject: Story = {
    args: {
        setOfProjects: randomTestProjects(1),
        recentRunDate: dayjs(),
    },
    play: async ({ canvasElement, step, args }) => {
        const screen = within(canvasElement);

        await step('testing the default value selected', async () => {
            const projectFilter = await screen.findByPlaceholderText(
                'Filter by Project Name',
            );
            await expect(projectFilter).toHaveValue(args.setOfProjects.at(0));
        });
    },
};

export const HasAllOptionsIfStartedToday: Story = {
    args: {
        setOfProjects: randomTestProjects(1),
        recentRunDate: dayjs(),
    },
    play: async ({ canvasElement, step, args }) => {
        const screen = within(canvasElement);
        const dateFilter = await screen.findByPlaceholderText(
            'Filter by Date Range',
        );

        await step('it should be there', async () => {
            await expect(dateFilter).toBeInTheDocument();
        });

        await step(
            'testing the options available under date filter',
            async () => {
                dateFilter.click();
                const options = await findAllByRole(
                    canvasElement.parentElement as HTMLElement,
                    'option',
                );
                await Promise.all(
                    options.map(async (value, index) => {
                        await expect(value).toHaveTextContent(
                            optionsForDate[
                                optionsForDate.length - index - 1
                            ] as string,
                        );
                    }),
                );
            },
        );

        await step('we can select and deselect options', async ({ args }) => {
            const options = await findAllByRole(
                canvasElement.parentElement as HTMLElement,
                'option',
            );

            // selecting
            options[0].click();
            await expect(args.onDateRangeChange).toHaveBeenLastCalledWith([
                optionsForDate.at(-1),
            ]);

            //deselecting
            (
                await findByRole(
                    canvasElement.parentElement as HTMLElement,
                    'option',
                    { selected: true },
                )
            ).click();

            await expect(args.onDateRangeChange).toHaveBeenLastCalledWith([]);
        });

        await step('we can only select max of 5 options', async ({ args }) => {
            for (let _ of optionsForDate) {
                //deselecting
                await (
                    await findAllByRole(
                        canvasElement.parentElement as HTMLElement,
                        'option',
                        { selected: false },
                    )
                )[0].click();
            }

            await expect(args.onDateRangeChange).toHaveBeenLastCalledWith(
                optionsForDate.toReversed().slice(0, 5),
            );
        });
    },
};

export const HasOptionsIfRecentWasInYesterday: Story = {
    args: {
        setOfProjects: randomTestProjects(1),
        recentRunDate: dayjs().subtract(1, 'day'),
    },
    play: async ({ canvasElement, step, args }) => {
        const screen = within(canvasElement);
        const dateFilter = await screen.findByPlaceholderText(
            'Filter by Date Range',
        );

        await step(
            'testing the options available under date filter',
            async () => {
                await dateFilter.click();
                const options = await findAllByRole(
                    canvasElement.parentElement as HTMLElement,
                    'option',
                );
                await expect(options.length).toBe(optionsForDate.length - 1);
                await Promise.all(
                    options.map(async (value, index) => {
                        await expect(value).toHaveTextContent(
                            optionsForDate.slice(0, -1)[
                                optionsForDate.length - index - 2
                            ] as string,
                        );
                    }),
                );
            },
        );
    },
};

const anyDayInThisWeek = dayjs().subtract(2, 'days');

export const HasOptionsIfRecentInThisWeek: Story = {
    args: {
        setOfProjects: randomTestProjects(1),
        recentRunDate: anyDayInThisWeek.isSame(dayjs(), 'week')
            ? anyDayInThisWeek
            : dayjs().subtract(1, 'day'),
    },
    play: async ({ canvasElement, step, args }) => {
        const screen = within(canvasElement);
        const dateFilter = await screen.findByPlaceholderText(
            'Filter by Date Range',
        );

        await step(
            'testing the options available under date filter',
            async () => {
                await dateFilter.click();
                const options = await findAllByRole(
                    canvasElement.parentElement as HTMLElement,
                    'option',
                );
                const hasYesterday = args.recentRunDate.isSame(
                    dayjs().subtract(1, 'day'),
                    'date',
                );
                const sub = hasYesterday ? 1 : 2;
                await expect(options.length).toBe(optionsForDate.length - sub);
                await Promise.all(
                    options.map(async (value, index) => {
                        await expect(value).toHaveTextContent(
                            optionsForDate.slice(0, -sub)[
                                optionsForDate.length - index - 1 - sub
                            ] as string,
                        );
                    }),
                );
            },
        );
    },
};

export const HasOptionsIfRecentIsInLastWeek: Story = {
    args: {
        setOfProjects: randomTestProjects(1),
        recentRunDate: dayjs().subtract(1, 'week'),
    },
    play: async ({ canvasElement, step, args }) => {
        const screen = within(canvasElement);
        const dateFilter = await screen.findByPlaceholderText(
            'Filter by Date Range',
        );

        await step(
            'testing the options available under date filter',
            async () => {
                await dateFilter.click();
                const options = await findAllByRole(
                    canvasElement.parentElement as HTMLElement,
                    'option',
                );
                await expect(options.length).toBe(optionsForDate.length - 3);
                await Promise.all(
                    options.map(async (value, index) => {
                        await expect(value).toHaveTextContent(
                            optionsForDate.slice(0, -3)[
                                optionsForDate.length - index - 1 - 3
                            ] as string,
                        );
                    }),
                );
            },
        );
    },
};

// i guess tests are enough till this

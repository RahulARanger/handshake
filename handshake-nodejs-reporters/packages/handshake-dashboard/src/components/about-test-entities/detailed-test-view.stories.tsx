import type { Meta, StoryObj } from '@storybook/react';
import { DetailedViewForSuite } from './detailed-test-view';
import { generateTestSuite } from 'stories/TestData/test-suites';
import transformSuiteEntity, {
    spawnConverterForAnsiToHTML,
} from 'extractors/transform-test-entity';
import { Chance } from 'chance';
import { generateTestRun } from 'stories/TestData/test-runs';
import transformTestRunRecord from 'extractors/transform-run-record';

const meta = {
    title: 'AboutTestCase/DetailedTestSuite',
    component: DetailedViewForSuite,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
} satisfies Meta<typeof DetailedViewForSuite>;

export default meta;
type Story = StoryObj<typeof meta>;

const generator = new Chance();
const randSuite = generateTestSuite({});
const testRun = transformTestRunRecord(generateTestRun());
const parser = spawnConverterForAnsiToHTML();

export const RandomSuite: Story = {
    args: {
        suite: transformSuiteEntity(
            randSuite,
            generator.integer({
                min: randSuite.tests,
                max: randSuite.tests + 100,
            }),
            parser,
        ),
        testRecord: testRun,
    },
};

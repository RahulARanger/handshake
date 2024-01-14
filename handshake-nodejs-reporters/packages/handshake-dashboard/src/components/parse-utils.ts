import { runPage } from 'src/components/scripts/helper';
import type TestRunRecord from 'src/types/test-run-records';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';

import type {
    DetailedTestRecord,
    ParsedRetriedRecords,
    SuiteDetails,
    TestDetails,
} from 'src/types/parsed-records';
import type {
    ErrorRecord,
    ImageRecord,
    RetriedRecord,
    SuiteRecordDetails,
    TestRecordDetails,
} from 'src/types/test-entity-related';
import type { specNode } from 'src/types/test-run-records';
import Convert from 'ansi-to-html';
import { attachmentPrefix } from 'src/types/ui-constants';

dayjs.extend(duration);

export function parseDetailedTestRun(
    testRun: TestRunRecord,
): DetailedTestRecord {
    const summary: {
        passed: number;
        failed: number;
        count: number;
        skipped: number;
    } = JSON.parse(testRun.suiteSummary);
    return {
        Started: [dayjs(testRun.started), dayjs()],
        Ended: [dayjs(testRun.ended), dayjs()],
        Title: testRun.projectName,
        Id: testRun.testID,
        Status: testRun.standing,
        Rate: [testRun.passed, testRun.failed, testRun.skipped],
        Duration: dayjs.duration({ milliseconds: testRun.duration }),
        Tests: testRun.tests,
        SuitesSummary: [summary.passed, summary.failed, summary.skipped],
        Suites: summary.count,
        Link: runPage(testRun.testID),
        projectName: testRun.projectName,
        specStructure: JSON.parse(testRun.specStructure) as specNode,
    };
}

function parseError(ansiToHTML: Convert, error: ErrorRecord): ErrorRecord {
    error.message = ansiToHTML.toHtml(error.message ?? '');
    error.stack = ansiToHTML.toHtml(error.stack ?? '');

    return error;
}

export function parseSuites(
    suites: SuiteRecordDetails[],
    testStartedAt: Dayjs,
    totalTests: number,
) {
    // @ts-expect-error not sure why this is happening, but for now let's ignore this
    const parsedRecords: SuiteDetails = { '@order': [] };
    const ansiToHTML = new Convert();

    for (const suite of suites) {
        parsedRecords['@order'].push(suite.suiteID);

        const error = parseError(ansiToHTML, JSON.parse(suite?.error ?? '{}'));

        const errors = (JSON.parse(suite.errors) as ErrorRecord[]).map(
            (error) => parseError(ansiToHTML, error),
        );

        parsedRecords[suite.suiteID] = {
            Started: [dayjs(suite.started), testStartedAt],
            Ended: [dayjs(suite.ended), testStartedAt],
            Status: suite.standing,
            Title: suite.title,
            Duration: dayjs.duration({ milliseconds: suite.duration }),
            Rate: [suite.passed, suite.failed, suite.skipped],
            Id: suite.suiteID,
            errors,
            error: error,
            RollupValues: [
                suite.rollup_passed,
                suite.rollup_failed,
                suite.rollup_skipped,
            ],
            totalRollupValue: suite.rollup_tests,
            entityName: suite.entityName,
            entityVersion: suite.entityVersion,
            simplified: suite.simplified,
            hooks: suite.hooks,
            numberOfErrors: suite.numberOfErrors,
            File: suite.file,
            Contribution: suite.rollup_tests / totalTests,
            Parent: suite.parent,
            type: suite.suiteType,
            Tests: suite.tests,
            Desc: suite.description,
        };
    }
    return parsedRecords;
}

export function parseTests(
    records: TestRecordDetails[],
    suites: SuiteDetails,
): TestDetails {
    const testDetails: TestDetails = {};
    const ansiToHTML = new Convert();

    for (const record of records) {
        const suiteStartedAt = suites[record.parent].Started[0];

        const error = parseError(ansiToHTML, JSON.parse(record?.error ?? '{}'));

        testDetails[record.suiteID] = {
            Title: record.title,
            Id: record.suiteID,
            type: record.suiteType,
            isBroken: record.broken,
            numberOfErrors: record.numberOfErrors,
            Started: [dayjs(record.started), dayjs(suiteStartedAt)],
            Ended: [dayjs(record.ended), dayjs(suiteStartedAt)],
            Duration: dayjs.duration(record.duration),
            Parent: record.parent,
            Tests: record.tests,
            error,
            errors: (JSON.parse(record.errors) as ErrorRecord[]).map((error) =>
                parseError(ansiToHTML, error),
            ),
            Rate: [record.passed, record.failed, record.skipped],
            Status: record.standing,
            Desc: record.description,
        };
    }
    return testDetails;
}

export function convertForWrittenAttachments(
    testID: string,
    attachmentID: string,
): string {
    const note = process?.env?.IMAGE_PROXY_URL
        ? [process.env.IMAGE_PROXY_URL]
        : [];
    return [...note, attachmentPrefix, testID, attachmentID].join('/');
}

export function parseImageRecords(
    images: ImageRecord[],
    testID: string,
): ImageRecord[] {
    return images.map((image) => ({
        ...image,
        path: convertForWrittenAttachments(testID, image.path),
    }));
}

export function parseRetriedRecords(retriedRecords: RetriedRecord[]) {
    const records: ParsedRetriedRecords = {};
    for (const record of retriedRecords)
        records[record.test] = {
            key: record.key,
            test: record.test,
            tests: JSON.parse(record.tests),
            length: record.length,
            suite_id: record.suite_id,
        };
    return records;
}

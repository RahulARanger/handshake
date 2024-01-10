import { runPage } from 'src/components/scripts/helper';
import type TestRunRecord from 'src/types/test-run-records';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';

import type {
    DetailedTestRecord,
    SuiteDetails,
} from 'src/types/parsed-records';
import type {
    ImageRecord,
    SuiteRecordDetails,
} from 'src/types/test-entity-related';
import type { specNode } from 'src/types/test-run-records';

dayjs.extend(duration);

// export default function parseTestEntity(
//     testORSuite: SuiteRecordDetails,
//     testStartedAt: Dayjs,
// ): QuickPreviewForScenarios {
//     return {
//         Started: [dayjs(testORSuite.started), testStartedAt],
//         Ended: [dayjs(testORSuite.ended), testStartedAt],
//         Status: testORSuite.standing,
//         Title: testORSuite.title,
//         Duration: dayjs.duration({ milliseconds: testORSuite.duration }),
//         Rate: [testORSuite.passed, testORSuite.failed, testORSuite.skipped],
//         Tests: testORSuite.tests,
//     };
// }

// export function parseDetailedTestEntity(
//     testORSuite: SuiteRecordDetails,
//     testStartedAt: Dayjs,
//     session: SessionRecordDetails,
// ): PreviewForDetailedEntities {
//     return {
//         Started: [dayjs(testORSuite.started), testStartedAt],
//         Ended: [dayjs(testORSuite.ended), testStartedAt],
//         Status: testORSuite.standing,
//         Title: testORSuite.title,
//         Duration: dayjs.duration({ milliseconds: testORSuite.duration }),
//         Rate: [
//             testORSuite.rollup_passed ?? 0,
//             testORSuite.rollup_failed ?? 0,
//             testORSuite.rollup_skipped ?? 0,
//         ],
//         Tests: testORSuite.tests,
//         File: testORSuite.file,
//         Retried: testORSuite.retried,
//         Description: testORSuite.description,
//         id: testORSuite.suiteID,
//         entityName: session.entityName,
//         entityVersion: session.entityVersion,
//         simplified: session.simplified,
//     };
// }

// export function parseTestCaseEntity(
//     testORSuite: SuiteRecordDetails,
//     testStartedAt: Dayjs,
// ): PreviewForTests {
//     return {
//         Started: [dayjs(testORSuite.started), testStartedAt],
//         Ended: [dayjs(testORSuite.ended), testStartedAt],
//         Status: testORSuite.standing,
//         Title: testORSuite.title,
//         Duration: dayjs.duration({ milliseconds: testORSuite.duration }),
//         Rate: [testORSuite.passed, testORSuite.failed, testORSuite.skipped],
//         Errors: JSON.parse(testORSuite.errors),
//         Description: testORSuite.description,
//         id: testORSuite.suiteID,
//         type: testORSuite.suiteType,
//         Parent: testORSuite.parent,
//     };
// }

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

export function parseSuites(
    suites: SuiteRecordDetails[],
    testStartedAt: Dayjs,
    totalTests: number,
) {
    // @ts-expect-error not sure why this is happening, but for now let's ignore this
    const parsedRecords: SuiteDetails = { '@order': [] };

    for (const suite of suites) {
        parsedRecords['@order'].push(suite.suiteID);
        parsedRecords[suite.suiteID] = {
            Started: [dayjs(suite.started), testStartedAt],
            Ended: [dayjs(suite.ended), testStartedAt],
            Status: suite.standing,
            Title: suite.title,
            Duration: dayjs.duration({ milliseconds: suite.duration }),
            Rate: [suite.passed, suite.failed, suite.skipped],
            Id: suite.suiteID,
            errors: JSON.parse(suite.errors),
            error: suite.error,
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
        };
    }
    return parsedRecords;
}

export function convertForWrittenAttachments(
    prefix: string,
    testID: string,
    attachmentID: string,
): string {
    const note = process?.env?.IMAGE_PROXY_URL
        ? [process.env.IMAGE_PROXY_URL]
        : [];
    return [...note, prefix, testID, attachmentID].join('/');
}

export function parseImageRecords(
    images: ImageRecord[],
    prefix: string,
    testID: string,
): ImageRecord[] {
    return images.map((image) => ({
        ...image,
        path: convertForWrittenAttachments(prefix, testID, image.path),
    }));
}

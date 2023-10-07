import runLink from 'src/Generators/linkProviders';
import type { SuiteRecordDetails } from 'src/types/testEntityRelated';
import type {
    QuickPreviewForScenarios,
    QuickPreviewForTestRun,
    PreviewForDetailedEntities,
    PreviewForTests,
} from 'src/types/parsedRecords';
import type TestRunRecord from 'src/types/testRunRecords';
import type SessionRecordDetails from 'src/types/sessionRecords';
import dayjs, { type Dayjs } from 'dayjs';
import duration from 'dayjs/plugin/duration';

dayjs.extend(duration);

export default function parseTestEntity(
    testORSuite: SuiteRecordDetails,
    testStartedAt: Dayjs,
): QuickPreviewForScenarios {
    return {
        Started: [dayjs(testORSuite.started), testStartedAt],
        Ended: [dayjs(testORSuite.ended), testStartedAt],
        Status: testORSuite.standing,
        Title: testORSuite.title,
        Duration: dayjs.duration({ milliseconds: testORSuite.duration }),
        Rate: [testORSuite.passed, testORSuite.failed, testORSuite.skipped],
        Tests: testORSuite.tests,
    };
}

export function parseDetailedTestEntity(
    testORSuite: SuiteRecordDetails,
    testStartedAt: Dayjs,
    session: SessionRecordDetails,
): PreviewForDetailedEntities {
    return {
        Started: [dayjs(testORSuite.started), testStartedAt],
        Ended: [dayjs(testORSuite.ended), testStartedAt],
        Status: testORSuite.standing,
        Title: testORSuite.title,
        Duration: dayjs.duration({ milliseconds: testORSuite.duration }),
        Rate: [testORSuite.passed, testORSuite.failed, testORSuite.skipped],
        Tests: testORSuite.tests,
        File: testORSuite.file,
        Retried: testORSuite.retried,
        Description: testORSuite.description,
        id: testORSuite.suiteID,
        browserName: session.browserName,
        browserVersion: session.browserVersion,
    };
}

export function parseTestCaseEntity(
    testORSuite: SuiteRecordDetails,
    testStartedAt: Dayjs,
): PreviewForTests {
    return {
        Started: [dayjs(testORSuite.started), testStartedAt],
        Ended: [dayjs(testORSuite.ended), testStartedAt],
        Status: testORSuite.standing,
        Title: testORSuite.title,
        Duration: dayjs.duration({ milliseconds: testORSuite.duration }),
        Rate: [testORSuite.passed, testORSuite.failed, testORSuite.skipped],
        Errors: JSON.parse(testORSuite.errors),
        Description: testORSuite.description,
        id: testORSuite.suiteID,
        type: testORSuite.suiteType,
    };
}

export function parseDetailedTestRun(
    testRun: TestRunRecord,
): QuickPreviewForTestRun {
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
        Status: testRun.standing,
        Rate: [testRun.passed, testRun.failed, testRun.skipped],
        Duration: dayjs.duration({ milliseconds: testRun.duration }),
        Tests: testRun.tests,
        SuitesSummary: [summary.passed, summary.failed, summary.skipped],
        Suites: summary.count,
        Link: runLink(testRun.testID),
    };
}

export const statusColors = ['green', '#FC4349', '#2C3E50'];

import dayjs, { Dayjs } from 'dayjs';
import type { DetailedTestRecord } from 'types/parsed-records';
import { testRunPage } from 'components/links';
import type {
    possibleFrameworks,
    specNode,
    SuiteSummary,
    TestRunRecord,
} from 'types/test-run-records';
import duration, { Duration } from 'dayjs/plugin/duration';
import { SuiteRecordDetails } from 'types/test-entity-related';

dayjs.extend(duration);

export default function transformTestRunRecord(
    testRunRecord: TestRunRecord,
): DetailedTestRecord {
    const suiteSummary = JSON.parse(testRunRecord.suiteSummary) as SuiteSummary;

    return {
        Started: dayjs(testRunRecord.started),
        Ended: dayjs(testRunRecord.ended),
        Title: testRunRecord.projectName,
        Id: testRunRecord.testID,
        Status: testRunRecord.standing,
        Frameworks: testRunRecord.framework
            .split(',')
            .map((_) => _.trim()) as possibleFrameworks[],
        Rate: [
            testRunRecord.passed,
            testRunRecord.failed,
            testRunRecord.skipped,
        ],
        Duration: dayjs.duration({ milliseconds: testRunRecord.duration }),
        Tests: testRunRecord.tests,
        SuitesSummary: [
            suiteSummary.passed,
            suiteSummary.failed,
            suiteSummary.skipped,
        ],
        Suites: suiteSummary.count,
        Link: testRunPage(testRunRecord.testID),
        projectName: testRunRecord.projectName.trim(),
        specStructure: JSON.parse(testRunRecord.specStructure) as specNode,
        timelineIndex: testRunRecord.timelineIndex - 1,
        projectIndex: testRunRecord.projectIndex - 1,
        Bail: testRunRecord.bail,
        ExitCode: testRunRecord.exitCode,
        FileRetries: testRunRecord.fileRetries,
        MaxInstances: testRunRecord.maxInstances,
        Platform: testRunRecord.platform.trim(),
    };
}

export interface OverviewOfEntities {
    recentSuites: SuiteRecordDetails[];
    aggregated: { files: number; sessions: number };
}
interface MiniSuitePreview {
    Started: Dayjs;
    Title: string;
    Rate: [number, number, number];
    Duration: Duration;
    Id: string;
}
export interface TransformedOverviewOfEntities {
    recentSuites: MiniSuitePreview[];
    aggregated: { files: number; sessions: number };
}

function transformMiniSuite(suite: SuiteRecordDetails): MiniSuitePreview {
    return {
        Started: dayjs(suite.started),
        Duration: dayjs.duration({ milliseconds: suite.duration }),
        Title: suite.title,
        Rate: [suite.passed, suite.failed, suite.skipped],
        Id: suite.suiteID,
    };
}

export function transformOverviewFeed(
    feed: OverviewOfEntities,
): TransformedOverviewOfEntities {
    return {
        recentSuites: feed.recentSuites.map((suite) =>
            transformMiniSuite(suite),
        ),
        aggregated: feed.aggregated,
    };
}

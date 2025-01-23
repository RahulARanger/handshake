import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import type { DetailedTestRecord } from 'types/parsed-records';
import { testRunPage } from 'components/links';
import type {
    possibleFrameworks,
    specStructure,
    TestRunRecord,
} from 'types/test-run-records';
import type { Duration } from 'dayjs/plugin/duration';
import duration from 'dayjs/plugin/duration';
import type { SuiteRecordDetails } from 'types/test-entity-related';
import type { statusOfEntity } from 'types/session-records';
import type { PlatformDetails } from 'components/about-test-entities/platform-entity';

dayjs.extend(duration);

export default function transformTestRunRecord(
    testRunRecord: TestRunRecord,
): DetailedTestRecord {
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
            testRunRecord.xfailed,
            testRunRecord.xpassed,
        ],
        Duration: dayjs.duration({ milliseconds: testRunRecord.duration }),
        Tests: testRunRecord.tests,
        SuitesSummary: [
            testRunRecord.passedSuites,
            testRunRecord.failedSuites,
            testRunRecord.skippedSuites,
            testRunRecord.xfailedSuites,
            testRunRecord.xpassedSuites,
        ],
        Suites: testRunRecord.suites,
        Link: testRunPage(testRunRecord.testID),
        projectName: testRunRecord.projectName.trim(),
        specStructure: JSON.parse(testRunRecord.specStructure) as specStructure,
        timelineIndex: testRunRecord.timelineIndex - 1,
        projectIndex: testRunRecord.projectIndex - 1,
        Bail: testRunRecord.bail,
        ExitCode: testRunRecord.exitCode,
        FileRetries: testRunRecord.fileRetries,
        MaxInstances: testRunRecord.maxInstances,
        Platform: testRunRecord.platform.trim(),
        Tags: JSON.parse(testRunRecord.tags),
        RunStatus: testRunRecord.status,
        ExcelExportUrl: testRunRecord.excelExport,
    };
}

export interface OverviewOfEntities {
    recentSuites: SuiteRecordDetails[];
    aggregated: { files: number; sessions: number };
    platforms: PlatformDetails;
}
export interface MiniSuitePreview {
    Started: Dayjs;
    Title: string;
    Rate: [number, number, number, number, number];
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
        Rate: [suite.passed, suite.failed, suite.skipped, suite.xfailed, suite.xpassed],
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

export function getStandingFromList(feeds: statusOfEntity[]): statusOfEntity {
    let foundRetried = false;
    let foundPassed = false;

    for (const feed of feeds) {
        switch (feed) {
            case 'FAILED': {
                return 'FAILED';
            }
            case 'PASSED': {
                foundPassed = true;
                break;
            }
            case 'RETRIED': {
                foundRetried = true;
                break;
            }
        }
    }

    if (foundPassed) return 'PASSED';

    return foundRetried ? 'RETRIED' : 'SKIPPED';
}

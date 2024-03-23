import dayjs from 'dayjs';
import type { DetailedTestRecord } from 'types/parsed-records';
import { runPage } from 'components/links';
import type {
    possibleFrameworks,
    specNode,
    SuiteSummary,
    TestRunRecord,
} from 'types/test-run-records';

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
        Link: runPage(testRunRecord.testID),
        projectName: testRunRecord.projectName,
        specStructure: JSON.parse(testRunRecord.specStructure) as specNode,
    };
}

import type { dbConnection } from 'src/components/scripts/connection';
import type { TestRunSummary } from 'src/types/testRunRecords';
import type TestRunRecord from 'src/types/testRunRecords';

const miniConditionForTestRuns = "WHERE ended <> ''";
const conditionForTestRuns = `${miniConditionForTestRuns} order by started desc limit ?`;

export default async function latestTestRun(
    connection: dbConnection,
): Promise<string> {
    const result = await connection.get<{ testID: string }>(
        `select testID from runbase where started = (select max(started) from runbase ${miniConditionForTestRuns});`,
    );
    return result?.testID ?? '';
}

export async function getDetailsOfTestRun(
    connection: dbConnection,
    testID: string,
): Promise<TestRunRecord | undefined> {
    return connection.get<TestRunRecord>(
        "SELECT * from runbase where testID = ? AND ended <> '';",
        testID,
    );
}

export async function getAllTestRunDetails(
    connection: dbConnection,
    maxTestRuns?: number,
): Promise<TestRunRecord[] | undefined> {
    return connection.all<TestRunRecord[]>(
        `SELECT * from runbase ${conditionForTestRuns}`,
        maxTestRuns ?? -1,
    );
}

export async function getDetailsOfRelatedRuns(
    connection: dbConnection,
    projectName: string,
    maxTestRuns?: number,
) {
    const runs = (
        await connection.all<Array<{ testID: string }>>(
            `select testID from runbase ${conditionForTestRuns}`,
            maxTestRuns ?? -1,
        )
    )?.map((run) => run.testID);
    const sqlHelperForRuns = `(${runs.map(() => '?').join(',')})`;

    return connection.all<TestRunRecord[]>(
        `SELECT * from runbase where projectName = ? and testID in ${sqlHelperForRuns} order by started desc;`,
        projectName,
        ...runs,
    );
}

export function generateTestRunSummary(
    _testDetails: TestRunRecord,
): TestRunSummary {
    const testDetails = JSON.parse(_testDetails.suiteSummary);
    return {
        TESTS: {
            passed: _testDetails.passed,
            failed: _testDetails.failed,
            skipped: _testDetails.skipped,
            tests: _testDetails.tests,
        },
        SUITES: {
            passed: testDetails.passed,
            failed: testDetails.failed,
            skipped: testDetails.skipped,
            count: testDetails.count,
        },
        RETRIED: _testDetails.retried,
    };
}

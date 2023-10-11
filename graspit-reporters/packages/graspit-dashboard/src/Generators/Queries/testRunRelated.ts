import type { dbConnection } from '../dbConnection';
import type { TestRunConfig, TestRunSummary } from 'src/types/testRunRecords';
import type TestRunRecord from 'src/types/testRunRecords';

export default async function latestTestRun(
    connection: dbConnection,
): Promise<string> {
    const result = await connection.get<{ testID: string }>(
        "select testID from runbase where started = (select max(started) from runbase where ended <> '');",
    );
    return result?.testID ?? '';
}

export async function getAllTestRuns(
    connection: dbConnection,
    maxTestRuns?: number,
): Promise<string[]> {
    const result = await connection.all<Array<{ testID: string }>>(
        "select testID, ended from runbase where ended <> '' order by started desc limit ?;",
        maxTestRuns ?? -1,
    );
    return result.map((testRun) => testRun.testID);
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
        "SELECT * from runbase where ended <> '' order by started desc LIMIT ?",
        maxTestRuns ?? -1,
    );
}

export async function getTestRunConfigRecords(
    connection: dbConnection,
    test_id: string,
): Promise<TestRunConfig[]> {
    return connection.all<TestRunConfig[]>(
        'SELECT * from testconfigbase where test_id = ?',
        test_id,
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

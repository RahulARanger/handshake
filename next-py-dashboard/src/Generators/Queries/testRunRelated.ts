import { type dbConnection } from "@/Generators/dbConnection";
import type DetailsOfRun from "@/types/testRun";
import { type TestRunSummary } from "@/types/testRun";

export default async function latestTestRun(
    connection: dbConnection
): Promise<string> {
    const result = await connection.get<{ testID: string }>(
        "select testID from runbase where started = (select max(started) from runbase);"
    );
    return result?.testID ?? "";
}

export async function getAllTestRuns(
    connection: dbConnection
): Promise<string[]> {
    const result = await connection.all<Array<{ testID: string }>>(
        "select testID from runbase;"
    );
    return result.map((testRun) => testRun.testID);
}

export async function getDetailsOfTestRun(
    connection: dbConnection,
    testID: string
): Promise<DetailsOfRun | undefined> {
    return await connection.get<DetailsOfRun>(
        "SELECT * from runbase where testID = ?",
        testID
    );
}

export async function getAllTestRunDetails(
    connection: dbConnection
): Promise<DetailsOfRun[] | undefined> {
    return await connection.all<DetailsOfRun[]>("SELECT * from runbase");
}

export function generateTestRunSummary(
    _testDetails: DetailsOfRun
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
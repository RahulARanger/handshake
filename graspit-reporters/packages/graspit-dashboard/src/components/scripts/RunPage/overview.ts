import type { dbConnection } from 'src/components/scripts/connection';
import type { SuiteDetails } from 'src/types/generatedResponse';
import type { TestRunConfig, TestRunSummary } from 'src/types/testRunRecords';
import type TestRunRecord from 'src/types/testRunRecords';

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

export interface SessionSummary {
    entityName: string;
    entityVersion: string;
    tests: number;
}

export async function getSessionSummary(
    connection: dbConnection,
    test_id: string,
) {
    return connection.all<SessionSummary[]>(
        'select entityName, entityVersion, sum(tests) as tests from sessionbase where test_id = ? group by entityName, entityVersion',
        test_id,
    );
}

export async function getDetailsOfTestRun(
    connection: dbConnection,
    testID: string,
) {
    return connection.get<TestRunRecord>(
        "SELECT * from runbase where testID = ? AND ended <> '';",
        testID,
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

export interface OverallAggResults {
    parentSuites: number;
    fileCount: number;
    sessionCount: number;
    imageCount: number;
    randomImages: string[];
    recentSuites: SuiteDetails[];
}

export async function getSomeAggResults(
    connection: dbConnection,
    test_id: string,
): Promise<OverallAggResults> {
    const allSessions = (
        await connection.all<Array<{ sessionID: string }>>(
            'select sessionID from sessionbase where test_id = ?',
            test_id,
        )
    )?.map((session) => session.sessionID);

    const sqlHelperForSessions = `(${allSessions.map(() => '?').join(',')})`;

    type expectedSuites = { suiteID: string };
    const possibleSuites = (
        await connection.all<Array<expectedSuites>>(
            `select suiteID from suitebase where session_id in ${sqlHelperForSessions}`,
            allSessions,
        )
    ).map((suite: expectedSuites) => suite.suiteID);

    const sqlHelperForSuites = `(${possibleSuites.map(() => '?').join(',')})`;

    const fileCount =
        (
            await connection.get<{ files: number }>(
                `SELECT count(distinct json_each.value) as files FROM sessionbase JOIN json_each(specs) ON 1=1 where test_id = ?;`,
                test_id,
            )
        )?.files ?? 0;

    const parentSuiteCount =
        (
            await connection.get<{ suites: number }>(
                `select count(*) as suites from suitebase where parent = '' and session_id in ${sqlHelperForSessions}`,
                allSessions,
            )
        )?.suites ?? 0;

    const imageCount =
        (
            await connection.get<{ attached: number }>(
                `select count(*) as attached from staticbase where type = 'PNG' AND entity_id in ${sqlHelperForSuites}`,
                possibleSuites,
            )
        )?.attached ?? 0;

    type expectedImage = { attachmentValue: string };
    const randomImages = (
        await connection.all<Array<expectedImage>>(
            `SELECT attachmentValue FROM staticbase WHERE type = 'PNG' and entity_id in ${sqlHelperForSuites} and attachmentID  IN (SELECT attachmentID FROM staticbase ORDER BY RANDOM() LIMIT 10)`,
            possibleSuites,
        )
    ).map((attached: expectedImage) => attached.attachmentValue);

    const recentSuites = await connection.all<SuiteDetails[]>(
        `select * from suitebase where suiteType = 'SUITE' and session_id in ${sqlHelperForSessions} limit 5`,
        allSessions,
    );

    return {
        parentSuites: parentSuiteCount,
        fileCount,
        sessionCount: allSessions.length,
        imageCount,
        randomImages,
        recentSuites,
    };
}

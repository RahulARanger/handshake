import type { dataBaseConnection } from 'src/components/scripts/connection';
import type { SuiteDetails } from 'src/types/generated-response';
import type { ImageRecord } from 'src/types/test-entity-related';
import type { TestRunConfig, TestRunSummary } from 'src/types/test-run-records';
import type TestRunRecord from 'src/types/test-run-records';

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
    connection: dataBaseConnection,
    test_id: string,
) {
    return connection.all<SessionSummary[]>(
        'select entityName, entityVersion, sum(tests) as tests from sessionbase where test_id = ? group by entityName, entityVersion',
        test_id,
    );
}

export async function getDetailsOfTestRun(
    connection: dataBaseConnection,
    testID: string,
) {
    return connection.get<TestRunRecord>(
        "SELECT * from runbase where testID = ? AND ended <> '';",
        testID,
    );
}

export async function getTestRunConfigRecords(
    connection: dataBaseConnection,
    test_id: string,
): Promise<TestRunConfig[]> {
    return connection.all<TestRunConfig[]>(
        'SELECT * from testconfigbase where test_id = ?',
        test_id,
    );
}

export async function getAllSessionIds(
    connection: dataBaseConnection,
    test_id: string,
): Promise<string[]> {
    const sessions = await connection.all<Array<{ sessionID: string }>>(
        'select sessionID from sessionbase where test_id = ?',
        test_id,
    );
    return sessions?.map((session) => session.sessionID);
}

export interface OverallAggResults {
    parentSuites: number;
    files: number;
    sessionCount: number;
    imageCount: number;
    randomImages: ImageRecord[];
    recentSuites: SuiteDetails[];
    recentTests: SuiteDetails[];
}

export async function getSomeAggResults(
    connection: dataBaseConnection,
    test_id: string,
): Promise<OverallAggResults> {
    const allSessions = await getAllSessionIds(connection, test_id);

    const sqlHelperForSessions = `(${allSessions.map(() => '?').join(',')})`;

    type expectedSuites = { suiteID: string };

    const allSuites = await connection.all<Array<expectedSuites>>(
        `select suiteID from suitebase where session_id in ${sqlHelperForSessions}`,
        allSessions,
    );
    const possibleSuites = allSuites.map(
        (suite: expectedSuites) => suite.suiteID,
    );

    const sqlHelperForSuites = `(${possibleSuites.map(() => '?').join(',')})`;

    const config = await connection.get<{ files: number }>(
        `SELECT count(distinct json_each.value) as files FROM sessionbase JOIN json_each(specs) ON 1=1 where test_id = ?;`,
        test_id,
    );
    const fileCount = config?.files ?? 0;

    const parentSuites = await connection.get<{ suites: number }>(
        `select count(*) as suites from suitebase where parent = '' and standing <> 'RETRIED' and session_id in ${sqlHelperForSessions}`,
        allSessions,
    );
    const parentSuiteCount = parentSuites?.suites ?? 0;

    const images = await connection.get<{ attached: number }>(
        `select count(*) as attached from staticbase where type = 'PNG' AND entity_id in ${sqlHelperForSuites}`,
        possibleSuites,
    );
    const imageCount = images?.attached ?? 0;

    type expectedImage = { attachmentValue: string };
    const pickedImages = await connection.all<Array<expectedImage>>(
        `SELECT attachmentValue FROM staticbase where attachmentID IN (SELECT attachmentID FROM staticbase where type = 'PNG' and entity_id in ${sqlHelperForSuites} ORDER BY RANDOM() LIMIT 10)`,
        possibleSuites,
    );
    const randomImages = pickedImages.map(
        (attached: expectedImage) => attached.attachmentValue,
    );

    const recentSuites = await connection.all<SuiteDetails[]>(
        `select * from suitebase where suiteType = 'SUITE' and session_id in ${sqlHelperForSessions} and standing <> 'RETRIED' limit 5`,
        allSessions,
    );

    const recentTests = await connection.all<SuiteDetails[]>(
        `select * from suitebase where suiteType = 'TEST' and session_id in ${sqlHelperForSessions} and standing <> 'RETRIED' limit 5`,
        allSessions,
    );
    // const recentSuites = await connection.all<SuiteDetails[]>(
    //     `select * from suitebase where suiteType = 'SUITE' and session_id in ${sqlHelperForSessions} and standing <> 'RETRIED' limit 5`,
    //     allSessions,
    // );
    // const recentSuites = await connection.all<SuiteDetails[]>(
    //     `select * from suitebase where suiteType = 'SUITE' and session_id in ${sqlHelperForSessions} and standing <> 'RETRIED' limit 5`,
    //     allSessions,
    // );

    return {
        parentSuites: parentSuiteCount,
        fileCount,
        sessionCount: allSessions.length,
        imageCount,
        randomImages,
        recentSuites,
        recentTests,
    };
}

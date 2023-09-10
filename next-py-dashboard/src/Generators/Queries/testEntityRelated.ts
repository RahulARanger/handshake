import { type dbConnection } from "@/Generators/dbConnection";
import {
    type SuiteRecordDetails,
    type SuiteDetails,
    type TestDetails,
} from "@/types/detailedTestRunPage";

export default async function getAllSuites(
    connection: dbConnection,
    testID: string
): Promise<SuiteDetails> {
    const suites = await connection.all<SuiteRecordDetails[]>(
        "select * from suitebase where suiteType = 'SUITE' and session_id = (select sessionID from sessionbase where test_id = ?)",
        testID
    );

    const order: string[] = [];
    // @ts-expect-error not sure why this one is happening
    const response: SuiteDetails = { "@order": order };

    suites.forEach((suite) => {
        response[suite.suiteID] = suite;
        order.push(suite.suiteID);
    });

    return response;
}

export async function getAllTests(
    connection: dbConnection,
    testID: string
): Promise<TestDetails> {
    const tests = await connection.all<SuiteRecordDetails[]>(
        "select * from suitebase where suiteType = 'TEST' and session_id = (select sessionID from sessionbase where test_id = ?)",
        testID
    );
    const response: TestDetails = {};

    tests.forEach((test) => {
        if (response[test.parent] == null) response[test.parent] = [test];
        else response[test.parent].push(test);
    });

    return response;
}

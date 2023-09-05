import { type dbConnection } from "@/Generators/dbConnection";
import {
    type SuiteRecordDetails,
    type SuiteDetails,
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
    const response: SuiteDetails = { "@order": [] };

    suites.forEach((suite) => {
        response[suite.suiteID] = suite;
        order.push(suite.suiteID);
    });

    return response;
}

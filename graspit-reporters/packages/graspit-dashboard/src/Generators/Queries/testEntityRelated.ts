// import { type dbConnection } from "@/Generators/dbConnection";
// import {
//     type SuiteRecordDetails,
//     type SuiteDetails,
//     type TestDetails,
// } from "@/types/detailedTestRunPage";
// import { Attachment, AttachmentDetails } from "@/types/detailedTestRunPage";

import type { dbConnection } from '../dbConnection';
import type { SuiteRecordDetails } from 'src/types/testEntityRelated';
import type { Attachment } from 'src/types/testEntityRelated';
import type {
    AttachmentDetails,
    SuiteDetails,
    TestDetails,
} from 'src/types/generatedResponse';

export default async function getAllSuites(
    connection: dbConnection,
    testID: string,
): Promise<SuiteDetails> {
    const suites = await connection.all<SuiteRecordDetails[]>(
        "select * from suitebase where suiteType = 'SUITE' and session_id in (select sessionID from sessionbase where test_id = ?)",
        testID,
    );

    const order: string[] = [];
    // @ts-expect-error not sure why this one is happening
    const response: SuiteDetails = { '@order': order };

    suites.forEach((suite) => {
        response[suite.suiteID] = suite;
        order.push(suite.suiteID);
    });

    return response;
}

export async function getAllTests(
    connection: dbConnection,
    testID: string,
): Promise<TestDetails> {
    const tests = await connection.all<SuiteRecordDetails[]>(
        "select * from suitebase where suiteType = 'TEST' and session_id in (select sessionID from sessionbase where test_id = ?)",
        testID,
    );
    const response: TestDetails = {};

    tests.forEach((test) => {
        response[test.suiteID] = test;
    });

    return response;
}

export async function getAllEntityLevelAttachments(
    connection: dbConnection,
    testID: string,
): Promise<AttachmentDetails> {
    const response: AttachmentDetails = {};
    const result = await connection.all<Attachment[]>(
        `select * from attachmentbase where entity_id in (
            select suiteID from suitebase where suiteType = 'TEST' 
            and session_id in (
              select sessionID from sessionbase where test_id = ?
              )
           )`,
        testID,
    );
    result.forEach((attachment) => {
        if (response[attachment.entity_id] == null)
            response[attachment.entity_id] = [attachment];
        else response[attachment.entity_id].push(attachment);
    });

    return response;
}

import type { dataBaseConnection } from 'src/components/scripts/connection';
import type {
    AttachmentDetails,
    RetriedRecords,
    SessionDetails,
    SuiteDetails,
    TestDetails,
} from 'src/types/generated-response';
import type {
    Attachment,
    SuiteRecordDetails,
} from 'src/types/test-entity-related';
import type SessionRecordDetails from 'src/types/session-records';

export async function getAllSessions(
    connection: dataBaseConnection,
    testID: string,
) {
    const sessions = await connection.all<SessionRecordDetails[]>(
        'select * from sessionbase where test_id = ?',
        testID,
    );
    const resp: SessionDetails = {};
    for (const session of sessions) resp[session.sessionID] = session;
    return resp;
}

export async function getDrillDownResults(
    connection: dataBaseConnection,
    testID: string,
): Promise<{
    suites: SuiteDetails;
    tests: TestDetails;
    sessions: SessionDetails;
    attachments: AttachmentDetails;
    writtenAttachments: AttachmentDetails;
    retriedRecords: RetriedRecords;
}> {
    const allSessions = await getAllSessions(connection, testID);
    const sessionsIDs = Object.keys(allSessions);
    const sqlHelperForSessions = `(${sessionsIDs.map(() => '?').join(',')})`;

    const suites = await connection.all<SuiteRecordDetails[]>(
        `select rollupbase.tests as rollup_tests, rollupbase.passed as rollup_passed, rollupbase.failed as rollup_failed, rollupbase.skipped as rollup_skipped, suitebase.* from suitebase join rollupbase on suitebase.suiteID = rollupbase.suite_id and suitebase.session_id in ${sqlHelperForSessions} order by suitebase.started`,
        sessionsIDs,
    );
    const order: string[] = [];
    // @ts-expect-error not sure why this one is happening
    const response: SuiteDetails = { '@order': order };

    for (const suite of suites) {
        response[suite.suiteID] = suite;
        order.push(suite.suiteID);
    }

    const tests = await connection.all<SuiteRecordDetails[]>(
        `select * from suitebase where suiteType = 'TEST' and session_id in ${sqlHelperForSessions}`,
        sessionsIDs,
    );
    const responseForTests: TestDetails = {};

    for (const test of tests) {
        responseForTests[test.suiteID] = test;
    }

    const entityIds = [...suites, ...tests].map((entity) => entity.suiteID);
    const sqlHelperForEntities = `(${entityIds.map(() => '?').join(',')})`;

    const attachments: AttachmentDetails = {};
    const attached = await connection.all<Attachment[]>(
        `SELECT * from attachmentbase where entity_id in ${sqlHelperForEntities}`,
        entityIds,
    );

    for (const attachment of attached) {
        const tray = attachments[attachment.entity_id] ?? [];
        tray.push(attachment);
        attachments[attachment.entity_id] = tray;
    }

    const writtenAttachments: AttachmentDetails = {};

    const rawFiles = await connection.all<Attachment[]>(
        `SELECT * from staticbase where entity_id in ${sqlHelperForEntities}`,
        entityIds,
    );
    // eslint-disable-next-line unicorn/no-array-for-each
    rawFiles.forEach((attachment: Attachment) => {
        const tray = writtenAttachments[attachment.entity_id] ?? [];
        tray.push(attachment);
        writtenAttachments[attachment.entity_id] = tray;
    });

    const retriedRecords: RetriedRecords = {};

    const records = await connection.all<
        Array<{ tests: string; suite_id: string; length: number }>
    >(
        `select * from retriedbase where suite_id in ${sqlHelperForEntities}`,
        entityIds,
    );
    for (const record of records) {
        const parsedRecord = {
            suite_id: record.suite_id,
            length: record.length,
            tests: JSON.parse(record.tests) as string[],
        };
        retriedRecords[record.suite_id] = parsedRecord;
        for (const test of retriedRecords[record.suite_id].tests)
            retriedRecords[test] = parsedRecord;
    }

    return {
        suites: response,
        tests: responseForTests,
        sessions: allSessions,
        attachments,
        writtenAttachments,
        retriedRecords: retriedRecords,
    };
}

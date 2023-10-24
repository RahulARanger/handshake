import type { dbConnection } from 'src/components/scripts/connection';
import type {
    AttachmentDetails,
    SessionDetails,
    SuiteDetails,
    TestDetails,
} from 'src/types/generatedResponse';
import type {
    Attachment,
    SuiteRecordDetails,
} from 'src/types/testEntityRelated';
import type SessionRecordDetails from 'src/types/sessionRecords';

export async function getAllSessions(connection: dbConnection, testID: string) {
    const sessions = await connection.all<SessionRecordDetails[]>(
        'select * from sessionbase where test_id = ?',
        testID,
    );
    const resp: SessionDetails = {};
    sessions.forEach((session) => (resp[session.sessionID] = session));
    return resp;
}

export async function getDrillDownResults(
    connection: dbConnection,
    testID: string,
): Promise<{
    suites: SuiteDetails;
    tests: TestDetails;
    sessions: SessionDetails;
    attachments: AttachmentDetails;
    writtenAttachments: AttachmentDetails;
}> {
    const allSessions = await getAllSessions(connection, testID);
    const sessionsIDs = Object.keys(allSessions);
    const sqlHelperForSessions = `(${sessionsIDs.map(() => '?').join(',')})`;

    const suites = await connection.all<SuiteRecordDetails[]>(
        `select * from suitebase where suiteType = 'SUITE' and session_id in ${sqlHelperForSessions}`,
        sessionsIDs,
    );
    const order: string[] = [];
    // @ts-expect-error not sure why this one is happening
    const response: SuiteDetails = { '@order': order };

    suites.forEach((suite) => {
        response[suite.suiteID] = suite;
        order.push(suite.suiteID);
    });

    const tests = await connection.all<SuiteRecordDetails[]>(
        `select * from suitebase where suiteType = 'TEST' and session_id in ${sqlHelperForSessions}`,
        sessionsIDs,
    );
    const responseForTests: TestDetails = {};

    tests.forEach((test) => {
        responseForTests[test.suiteID] = test;
    });

    const entityIds = [...suites, ...tests].map((entity) => entity.suiteID);
    const sqlHelperForEntities = `(${entityIds.map(() => '?').join(',')})`;

    const attachments: AttachmentDetails = {};
    (
        await connection.all<Attachment[]>(
            `SELECT * from attachmentbase where entity_id in ${sqlHelperForEntities}`,
            entityIds,
        )
    ).map((attachment) => {
        const tray = writtenAttachments[attachment.entity_id] ?? [];
        tray.push(attachment);
        writtenAttachments[attachment.entity_id] = tray;
    });

    const writtenAttachments: AttachmentDetails = {};

    (
        await connection.all<Attachment[]>(
            `SELECT * from staticbase where entity_id in ${sqlHelperForEntities}`,
            entityIds,
        )
    ).map((attachment: Attachment) => {
        const tray = writtenAttachments[attachment.entity_id] ?? [];
        tray.push(attachment);
        writtenAttachments[attachment.entity_id] = tray;
    });

    return {
        suites: response,
        tests: responseForTests,
        sessions: allSessions,
        attachments,
        writtenAttachments,
    };
}

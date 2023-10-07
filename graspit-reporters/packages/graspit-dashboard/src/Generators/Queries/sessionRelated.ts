import type { dbConnection } from '../dbConnection';
import type { SessionDetails } from 'src/types/generatedResponse';
import type SessionRecordDetails from 'src/types/sessionRecords';

export default async function getAllSessions(
    connection: dbConnection,
    testID: string,
): Promise<SessionDetails> {
    const response: SessionDetails = {};
    const result = await connection.all<SessionRecordDetails[]>(
        'select * from sessionbase where test_id = ?',
        testID,
    );
    result.forEach((session) => {
        response[session.sessionID] = session;
    });

    return response;
}

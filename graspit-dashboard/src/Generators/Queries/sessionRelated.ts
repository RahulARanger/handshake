import { type dbConnection } from "@/Generators/dbConnection";
import { type SessionDetails } from "@/types/detailedTestRunPage";
import type SessionRecordDetails from "@/types/sessionRelated";

export default async function getAllSessions(
    connection: dbConnection,
    testID: string
): Promise<SessionDetails> {
    const response: SessionDetails = {};
    const result = await connection.all<SessionRecordDetails[]>(
        "select * from sessionbase where test_id = ?",
        testID
    );
    result.forEach((session) => {
        response[session.sessionID] = session;
    });

    return response;
}

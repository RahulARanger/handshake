import { type dbConnection } from "@/Generators/dbConnection";
import {
    type Attachment,
    type AttachmentDetails,
} from "@/types/detailedTestRunPage";

export default async function getAllEntityLevelAttachments(
    connection: dbConnection,
    testID: string
): Promise<AttachmentDetails> {
    const response: AttachmentDetails = {};
    const result = await connection.all<Attachment[]>(
        `select * from attachmentbase where entity_id in (
            select suiteID from suitebase where suiteType = 'TEST' 
            and session_id in (
              select sessionID from sessionbase where test_id = ?
              )
           )`,
        testID
    );
    result.forEach((attachment) => {
        if (response[attachment.entity_id] == null)
            response[attachment.entity_id] = [attachment];
        else response[attachment.entity_id].push(attachment);
    });

    return response;
}

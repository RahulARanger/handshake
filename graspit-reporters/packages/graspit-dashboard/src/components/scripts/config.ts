import type { dbConnection } from 'src/components/scripts/connection';
import type ExportConfig from 'src/types/exportConfigRecords';

export default async function currentExportConfig(
    connection: dbConnection,
): Promise<ExportConfig | undefined> {
    const ticketID = process.env.TICKET_ID;
    if (ticketID == null) {
        return undefined;
    }
    const result = await connection.get<ExportConfig>(
        'select * from exportbase where ticketID = ?',
        ticketID,
    );
    return result;
}

export async function getAllTestRuns(
    connection: dbConnection,
    limit: number,
): Promise<string[]> {
    const result = (
        await connection.all<Array<{ testID: string }>>(
            "select testID, ended from runbase where ended <> '' order by started desc limit ?;",
            limit,
        )
    ).map((result) => result.testID);
    return result;
}

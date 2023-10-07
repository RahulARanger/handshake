import { type dbConnection } from '../dbConnection';
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

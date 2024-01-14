import type { dataBaseConnection } from 'src/components/scripts/connection';
import type ExportConfig from 'src/types/export-config-records';

export default async function currentExportConfig(
    connection: dataBaseConnection,
): Promise<ExportConfig | undefined> {
    const ticketID = process.env.TICKET_ID;
    if (ticketID == undefined) {
        return undefined;
    }
    const result = await connection.get<ExportConfig>(
        'select * from exportbase where ticketID = ?',
        ticketID,
    );
    return result;
}

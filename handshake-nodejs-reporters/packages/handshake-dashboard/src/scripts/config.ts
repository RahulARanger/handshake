import type { dataBaseConnection } from 'scripts/connection';
import type ExportConfig from 'types/export-config-records';

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

export async function latestRun(
    connection: dataBaseConnection,
): Promise<string> {
    const result = await connection.get<{ testID: string }>(
        "select testID from runbase where ended <> '' order by started desc limit 1",
    );
    return result?.testID ?? '';
}

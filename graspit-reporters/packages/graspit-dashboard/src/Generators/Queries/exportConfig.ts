import { type dbConnection } from "@/Generators/dbConnection";
import type ExportConfig from "@/types/exportConfig";

export default async function currentExportConfig(
    connection: dbConnection,
): Promise<ExportConfig | undefined> {
    const ticketID = process.env.TICKET_ID;
    if (ticketID == null) {
        return undefined;
    }
    const result = await connection.get<ExportConfig>(
        "select * from exportbase where ticketID = ?",
        ticketID,
    );
    return result;
}

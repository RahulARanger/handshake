import { verbose, type Database, type Statement } from "sqlite3";
import { open, type Database as sqlite } from "sqlite";
import { existsSync } from "node:fs";

export type dbConnection = sqlite<Database, Statement>;

export default async function getConnection(): Promise<dbConnection> {
    if (process.env.DB_PATH == null)
        throw new Error('😓 Please set the DB "Path"');

    const verboseMode = verbose();
    if (!existsSync(process.env.DB_PATH))
        throw new Error(
            `Not able to find the database: ${process.env.DB_PATH}`
        );

    return await open({
        filename: process.env.DB_PATH,
        driver: verboseMode.Database,
        mode: verboseMode.OPEN_READONLY,
    });
}

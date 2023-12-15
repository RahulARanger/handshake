import { Database } from 'sqlite3';
// import { cached, type Statement } from 'sqlite3';
import { type Statement } from 'sqlite3';
import { open, type Database as sqlite } from 'sqlite';
import { existsSync } from 'node:fs';

export type dataBaseConnection = sqlite<Database, Statement>;

export default async function getConnection(): Promise<dataBaseConnection> {
    if (process.env.DB_PATH == undefined)
        throw new Error('😓 Please set the DB "Path"');

    if (!existsSync(process.env.DB_PATH))
        throw new Error(
            `Not able to find the database: ${process.env.DB_PATH}`,
        );

    return await open({
        filename: process.env.DB_PATH,
        driver: Database,
        // driver: cached.Database,
    });
}

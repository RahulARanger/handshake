import type { dbConnection } from 'src/components/scripts/connection';

export async function getAllTestRuns(
    connection: dbConnection,
    maxTestRuns?: number,
): Promise<string[]> {
    const result = await connection.all<Array<{ testID: string }>>(
        "select testID, ended from runbase where ended <> '' order by started desc limit ?;",
        maxTestRuns ?? -1,
    );
    return result.map((testRun) => testRun.testID);
}

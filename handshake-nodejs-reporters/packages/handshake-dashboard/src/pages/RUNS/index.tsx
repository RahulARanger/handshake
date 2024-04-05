export { default } from 'components/about-test-runs/page';
import getConnection from 'scripts/connection';
import { type GetStaticPropsResult } from 'next';
import currentExportConfig from 'scripts/config';
import sqlFile from 'scripts/run-page/script';
import type { TestRunRecord } from 'types/test-run-records';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export async function getStaticProps(): Promise<
    GetStaticPropsResult<{ runs?: TestRunRecord[]; about?: string }>
> {
    if (process.env.isDynamic) {
        return { props: { runs: undefined } };
    }

    const connection = await getConnection();
    const exportConfig = await currentExportConfig(connection);

    const allRuns = await connection.all<TestRunRecord[]>(
        sqlFile('runs-page.sql'),
        Number(exportConfig?.maxTestRuns ?? -1),
    );

    await connection.close();

    return {
        props: {
            runs: allRuns,
            about: String(
                readFileSync(join(process.cwd(), 'public', 'about.md')),
            ),
        },
    };
}

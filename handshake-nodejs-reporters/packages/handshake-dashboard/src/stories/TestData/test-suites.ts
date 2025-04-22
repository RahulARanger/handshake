import { Chance } from 'chance';
import dayjs from 'dayjs';
import { SuiteRecordDetails } from 'types/test-entity-related';
import { generateTestRun, getStatus } from './test-runs';
import { sortBy } from 'lodash-es';
import { TestRunRecord } from 'types/test-run-records';
import { generateErrors } from './error';

const generator = Chance();

function splitAnInteger(number: number, n: number, min?: number, max?: number) {
    let modifiedMin = min ?? 0;
    let modifiedMax = max ?? number;
    let tillNow = 0;

    return [
        ...Array.from({ length: n - 1 }).map((_, index) => {
            modifiedMax = Math.min(
                number - tillNow - modifiedMin * (n - 1 - index),
                modifiedMax,
            );
            modifiedMin = Math.max(
                number - tillNow - modifiedMax * (n - 1 - index),
                modifiedMin,
            );
            const part = generator.integer({
                min: modifiedMin,
                max: modifiedMax,
            });
            tillNow += part;
            return part;
        }),
        number - tillNow,
    ];
}

export function generateTestSuite(
    feeder: Partial<SuiteRecordDetails>,
): SuiteRecordDetails {
    const tests = feeder.tests ?? generator.integer({ min: 5, max: 10 });
    const parent = feeder.parent ?? '';

    // eslint-disable-next-line prefer-const
    let [passed, failed, rest] = splitAnInteger(tests, 3);
    let [skipped, xpassed, xfailed] = splitAnInteger(rest, 3);

    passed = feeder.passed ?? passed;
    failed = feeder.failed ?? failed;
    skipped = feeder.skipped ?? skipped;
    xpassed = feeder.xpassed ?? xpassed;
    xfailed = feeder.xfailed ?? xfailed;

    const duration =
        feeder.duration ?? generator.integer({ min: 1e3, max: 10e3 });

    const backBy = generator.pickone([
        'week',
        'days',
        'months',
    ]) as dayjs.ManipulateType;

    const durationFor = generator.pickone([
        'minutes',
        'seconds',
        'hours',
    ]) as dayjs.ManipulateType;

    const back = generator.integer({ min: 0, max: 3 });
    const started =
        feeder.started ??
        dayjs()
            .subtract(back, backBy)
            .subtract(generator.integer({ min: 10, max: 20 }), durationFor)
            .toISOString();

    const ended = feeder.ended ?? dayjs(started).add(duration).toISOString();

    const tags = Array.from({ length: generator.integer({ min: 0, max: 4 }) })
        .map(() =>
            generator.bool()
                ? { label: generator.hashtag(), desc: 'test' }
                : false,
        )
        .filter((index) => index !== false);

    const suiteStatus = getStatus(passed, failed, skipped, xfailed, xpassed);

    return {
        title: generator.name(),
        description: generator.paragraph(),
        tests,
        parent: parent,
        passed,
        failed,
        xpassed,
        xfailed,
        skipped,
        rollup_passed: (feeder.rollup_passed ?? 0) + passed,
        rollup_failed: (feeder.rollup_failed ?? 0) + failed,
        rollup_skipped: (feeder.rollup_skipped ?? 0) + skipped,
        rollup_tests: (feeder.rollup_tests ?? 0) + tests,
        hooks: generator.integer({ min: 0, max: 10 }),
        duration,
        file: feeder.file ?? generator.name() + '.js',
        hasChildSuite: feeder.hasChildSuite ?? false,
        started,
        ended,
        simplified: generator.company(),
        entityName: generator.company(),
        entityVersion: generator.apple_token(),
        suiteType: 'SUITE',
        numberOfErrors: failed ? generator.integer({ min: 1, max: 3 }) : 0,
        suiteID: crypto.randomUUID(),
        tags,
        errors: suiteStatus === 'FAILED' ? generateErrors() : [],
        standing: suiteStatus,
        retried: 0,
        session_id: '',
        Parent: '',
        type: 'SUITE',
        totalRollupValue: 0,
        Desc: '',
    };
}

export function generateTestHierarchyWithSuites(
    storeMap?: Record<string, SuiteRecordDetails>,
    feeder?: Partial<SuiteRecordDetails>,
    tillNow?: number,
    rootSuite?: SuiteRecordDetails,
    limit?: number,
): {
    suitesMap?: Record<string, SuiteRecordDetails>;
    suites?: SuiteRecordDetails[];
    run?: TestRunRecord;
} {
    const detailsMap = storeMap ?? {};

    if (feeder && rootSuite && tillNow && limit) {
        if (tillNow >= limit) {
            return { suitesMap: detailsMap };
        }
        const leafs = generator.integer({ min: 0, max: limit - tillNow - 1 });

        const childSuite = generateTestSuite(feeder);

        for (const _ of Array.from({ length: leafs }).keys()) {
            generateTestHierarchyWithSuites(
                detailsMap,
                {
                    ...feeder,
                },
                tillNow + _ + 1,
                childSuite,
                limit,
            );
        }
        detailsMap[childSuite.suiteID] = childSuite;
        return { suitesMap: detailsMap };
    }
    const numberOfTrees = generator.integer({ min: 1, max: 3 });
    const totalNodes = generator.integer({ min: 1, max: 15 });
    let firstTillNow = 0;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for (const _ of Array.from({ length: numberOfTrees })) {
        const rootSuite = generateTestSuite({ hasChildSuite: true });
        detailsMap[rootSuite.suiteID] = rootSuite;
        firstTillNow += 1;

        generateTestHierarchyWithSuites(
            detailsMap,
            {
                file: rootSuite.file,
                parent: rootSuite.suiteID,
            },
            firstTillNow,
            rootSuite,
            totalNodes,
        );
    }

    return {
        run: generateTestRun(),
        suites: sortBy(Object.values(detailsMap ?? {}), 'started'),
    };
}

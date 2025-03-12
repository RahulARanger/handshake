import { Chance } from 'chance';
import dayjs from 'dayjs';
import { SuiteRecordDetails } from 'types/test-entity-related';
import { generateTestRun, getStatus } from './test-runs';
import { minBy, sortBy, sumBy } from 'lodash-es';
import { TestRunRecord } from 'types/test-run-records';

const generator = Chance();

function splitIntoNParts(
    number: number,
    n: number,
    min?: number,
    max?: number,
) {
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

export function generateTestSuiteFromTestRun() {
    const run = generateTestRun({
        passed: 60,
        failed: 10,
        skipped: 20,
        passedSuites: 3,
        failedSuites: 2,
        skippedSuites: 1,
        xpassedSuites: 0,
        xfailedSuites: 0,
    });

    const testPerPassedSuites = Math.floor(run.passed / run.suites);
    const testsPerFailedSuites = Math.floor(run.failed / run.failedSuites);
    const testsForSkippedSuites = Math.floor(run.skipped / run.skippedSuites);

    const durationsForParentSuites = splitIntoNParts(run.duration, 3);

    let startFrom = dayjs(new Date(run.started));

    let passedSuites = run.passedSuites;

    let failedSuites = run.failedSuites;

    let skippedSuites = run.skippedSuites;

    const createPassedSuite = (arguments_?: Record<string, unknown>) => {
        const ended = startFrom.add(
            dayjs.duration({
                milliseconds: ((arguments_ ?? {})['duration'] as number) ?? 10,
            }),
        );
        const _ = generateTestSuite({
            tests: testPerPassedSuites,
            passed: testPerPassedSuites,
            failed: 0,
            skipped: 0,
            xpassed: 0,
            xfailed: 0,
            ...arguments_,
            started: startFrom,
            ended,
        });
        startFrom = ended;
        passedSuites -= 1;
        return _;
    };
    const createFailedSuite = (arguments_?: Record<string, unknown>) => {
        const ended = startFrom.add(
            dayjs.duration({
                milliseconds: ((arguments_ ?? {})['duration'] as number) ?? 10,
            }),
        );
        const _ = generateTestSuite({
            ...arguments_,
            ended,
            tests: testsPerFailedSuites + testPerPassedSuites,
            passed: testPerPassedSuites,
            failed: testsPerFailedSuites,
            skipped: 0,
            xpassed: 0,
            xfailed: 0,
        });
        startFrom = ended;
        failedSuites -= 1;
        return _;
    };
    const createskippedSuite = (arguments_?: Record<string, unknown>) => {
        const ended = startFrom.add(
            dayjs.duration({
                milliseconds: ((arguments_ ?? {})['duration'] as number) ?? 10,
            }),
        );
        const _ = generateTestSuite({
            tests: testsForSkippedSuites,
            ...arguments_,
            skipped: testsForSkippedSuites,
            passed: 0,
            failed: 0,
            xfailed: 0,
            xpassed: 0,
        });
        startFrom = ended;
        skippedSuites -= 1;
        return _;
    };

    const firstLevel = [
        createPassedSuite({
            hasChildSuite: true,
            duration: durationsForParentSuites[0],
        }),
        createFailedSuite({
            hasChildSuite: true,
            duration: durationsForParentSuites[1],
        }),
        createskippedSuite({
            hasChildSuite: false,
            duration: durationsForParentSuites[2],
        }),
    ];
    const secondLevel = [
        createPassedSuite({
            parent: firstLevel[0].suiteID,
            hasChildSuite: true,
            file: firstLevel[0].file,
            duration: durationsForParentSuites[0] - Math.random(),
        }),
        createFailedSuite({
            parent: firstLevel[1].suiteID,
            hasChildSuite: true,
            file: firstLevel[1].file,
            duration: durationsForParentSuites[1] - Math.random(),
        }),
    ];
    return {
        run,
        suites: [
            ...firstLevel,
            ...secondLevel,
            ...Array.from({ length: passedSuites }).map(() =>
                createPassedSuite({
                    parent: secondLevel[0],
                    file: secondLevel[0].file,
                }),
            ),
            ...Array.from({ length: failedSuites }).map(() =>
                createFailedSuite({
                    parent: secondLevel[1],
                    file: secondLevel[1].file,
                }),
            ),
            ...Array.from({ length: skippedSuites }).map(() =>
                createskippedSuite({
                    parent: firstLevel[2],
                    file: firstLevel[2].file,
                }),
            ),
        ],
    };
}

function generateTestSuite(
    feeder: Partial<SuiteRecordDetails>,
): SuiteRecordDetails {
    const tests = feeder.tests ?? generator.integer({ min: 5, max: 45 });
    const parent = feeder.parent ?? '';
    let rest = tests;

    const passed =
        feeder.passed ?? generator.integer({ min: 5, max: Math.max(5, rest) });
    rest -= Math.min(rest, passed);

    const failed =
        feeder.failed ?? generator.integer({ min: 1, max: Math.max(1, rest) });
    rest -= Math.min(rest, failed);

    const skipped =
        feeder.skipped ?? generator.integer({ min: 1, max: Math.max(1, rest) });
    rest -= Math.min(rest, skipped);

    const xpassed =
        feeder.xpassed ?? generator.integer({ min: 1, max: Math.max(1, rest) });
    rest -= Math.min(rest, xpassed);

    const xfailed = rest;

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
                ? { name: generator.hashtag(), label: 'test' }
                : false,
        )
        .filter((index) => index !== false);

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
        rollup_passed: passed,
        rollup_failed: failed,
        rollup_skipped: skipped,
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
        errors: [],
        standing: getStatus(passed, failed, skipped, xfailed, xpassed),
    };
}

export function generateTestHierarchyWithSuites(
    storeMap?: Record<string, SuiteRecordDetails>,
    feeder?: Partial<SuiteRecordDetails>,
    tillNow?: number,
    childSuites?: SuiteRecordDetails[],
    limit?: number,
): {
    suitesMap?: Record<string, SuiteRecordDetails>;
    suites?: SuiteRecordDetails[];
    run?: TestRunRecord;
} {
    const currentLevelSuites: SuiteRecordDetails[] = [];
    const detailsMap = storeMap ?? {};

    if (feeder && childSuites && tillNow && limit) {
        if (tillNow > limit) {
            return { suitesMap: detailsMap };
        }
        const parentSuite = generateTestSuite(feeder);
        for (const childSuite of childSuites) {
            childSuite.parent = parentSuite.suiteID;
        }
        detailsMap[parentSuite.suiteID] = parentSuite;

        const started = dayjs(parentSuite.started).subtract(
            dayjs.duration({
                seconds: generator.integer({ min: 0, max: 1e3 }),
            }),
        );

        const ended = dayjs(parentSuite.ended).add(
            dayjs.duration({
                seconds: generator.integer({ min: 0, max: 1e3 }),
            }),
        );
        generateTestHierarchyWithSuites(
            detailsMap,
            {
                rollup_tests: parentSuite.rollup_tests,
                file: parentSuite.file,
                rollup_passed: parentSuite.rollup_passed,
                rollup_failed: parentSuite.rollup_failed,
                rollup_skipped: parentSuite.rollup_skipped,
                started: started.toISOString(),
                ended: ended.toISOString(),
                duration: ended.diff(started),
                hasChildSuite: true,
            },
            tillNow + 1,
            [parentSuite],
            limit,
        );
        return { suitesMap: detailsMap };
    }

    const numberOfTrees = generator.integer({ min: 1, max: 60 });
    const firstLimit = generator.integer({ min: 10, max: 100 });
    let firstTillNow = 0;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for (const _ of Array.from({ length: numberOfTrees })) {
        const leafs = generator.integer({ min: 1, max: 5 });

        let reference;

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        for (const __ of Array.from({ length: leafs })) {
            const childSuite = generateTestSuite(reference ?? {});

            if (!reference) {
                reference = { file: childSuite.file };
            }

            detailsMap[childSuite.suiteID] = childSuite;
            currentLevelSuites.push(childSuite);
            firstTillNow += 1;
        }

        generateTestHierarchyWithSuites(
            detailsMap,
            {
                rollup_tests: sumBy(currentLevelSuites, 'tests'),
                file: currentLevelSuites[0].file,
                rollup_passed: sumBy(currentLevelSuites, 'passed'),
                rollup_failed: sumBy(currentLevelSuites, 'failed'),
                rollup_skipped: sumBy(currentLevelSuites, 'skipped'),
                started: minBy(currentLevelSuites, 'started')?.started,
                duration: sumBy(currentLevelSuites, 'duration'),
                hasChildSuite: true,
            },
            firstTillNow,
            currentLevelSuites,
            firstLimit,
        );
    }

    return {
        run: generateTestRun(),
        suites: sortBy(Object.values(detailsMap ?? {}), 'started'),
    };
}

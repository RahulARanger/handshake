import dayjs from 'dayjs';
import { Chance } from 'chance';
import type { statusOfEntity } from 'types/session-records';
import type { Project, Projects, TestRunRecord } from 'types/test-run-records';

interface Feeder {
    started?: dayjs.Dayjs;
    ended?: dayjs.Dayjs;
    framework?: string;
    passed?: number;
    failed?: number;
    skipped?: number;
    tests?: number;
    xpassed?: number;
    xfailed?: number;
    avoidParentSuitesInCount?: boolean;
    fileRetries?: number;
    maxInstances?: number;
    suites?: number;
    passedSuites?: number;
    failedSuites?: number;
    skippedSuites?: number;
    xpassedSuites?: number;
    xfailedSuites?: number;
}

export function getStatus(
    passed: number,
    failed: number,
    skipped: number,
): statusOfEntity {
    if (failed) return 'FAILED';
    return passed === 0 && skipped !== 0 ? 'SKIPPED' : 'PASSED';
}
const generator = Chance();

export function generateTestRun(rawFeed?: Feeder): TestRunRecord {
    const feed: Feeder = rawFeed ?? {};

    const tests = feed.tests ?? generator.integer({ min: 3, max: 100 });
    const passed = feed.passed ?? generator.integer({ min: 0, max: tests });
    const xpassed = feed.xpassed ?? generator.integer({ min: 0, max: tests });
    const failed =
        feed.failed ?? generator.integer({ min: 0, max: tests - passed });
    const xfailed =
        feed.xfailed ?? generator.integer({ min: 0, max: tests - passed });

    const skipped = tests - (passed + failed);

    const fileRetries =
        feed.fileRetries ?? generator.integer({ min: 0, max: 2 });

    const maxInstances =
        feed.maxInstances ?? generator.integer({ min: 0, max: 2 });

    const bail = generator.integer({ min: 0, max: 3 });

    const suites = feed.suites ?? generator.integer({ min: 1, max: tests });
    const passedSuites =
        feed.passedSuites ?? generator.integer({ min: 0, max: suites });
    const failedSuites =
        feed.failedSuites ??
        generator.integer({
            min: 0,
            max: suites - passedSuites,
        });
    const xfailedSuites =
        feed.xfailedSuites ??
        generator.integer({
            min: 0,
            max: suites - (passedSuites + failedSuites),
        });
    const xpassedSuites =
        feed.xpassedSuites ??
        generator.integer({
            min: 0,
            max: suites - (passedSuites + failedSuites + xfailedSuites),
        });
    const skippedSuites =
        suites - (xfailedSuites + xpassedSuites + passedSuites + failedSuites);

    const platform = generator.pickone([
        'windows',
        'macos',
        'win32',
        'mac13',
        'ubuntu',
    ]);

    const tags = Array.from({length: generator.integer({ min: 0, max: 4 })})
        .map(() =>
            generator.bool()
                ? { name: generator.hashtag(), label: 'test' }
                : false,
        )
        .filter((index) => index !== false);

    const back = generator.integer({ min: 0, max: 3 });
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

    const started = (
        feed.started ??
        dayjs()
            .subtract(back, backBy)
            .subtract(generator.integer({ min: 10, max: 20 }), durationFor)
    ).toISOString();
    const ended = (
        feed.ended ??
        dayjs()
            .subtract(back, backBy)
            .subtract(generator.integer({ min: 5, max: 9 }), durationFor)
    ).toISOString();

    return {
        started,
        ended,
        framework: feed.framework ?? 'webdriverio,mocha',
        passed,
        failed,
        xpassed,
        xfailed,
        skipped,
        platform,
        avoidParentSuitesInCount: feed.avoidParentSuitesInCount || false,
        exitCode: Number(failed),
        fileRetries,
        maxInstances,
        bail,
        suites: suites,
        passedSuites: passedSuites,
        failedSuites: failedSuites,
        xpassedSuites: xpassedSuites,
        xfailedSuites: xfailedSuites,
        skippedSuites: skippedSuites,
        duration: dayjs(ended).diff(dayjs(started)),
        projectName: generator.company(),
        testID: crypto.randomUUID(),
        tests,
        standing: getStatus(passed, failed, skipped),
        tags: JSON.stringify(tags),
        specStructure: JSON.stringify({
            'features\\login.feature': {
                current: 'features\\login.feature',
                suites: 2,
            },
        }),
        retried: generator.integer({ min: 0, max: 1 }),
        projectIndex: generator.integer({ min: 0, max: 10 }),
        timelineIndex: generator.integer({ min: 0, max: 20 }),
        status: generator.pickone([
            'COMPLETED',
            'INTERRUPTED',
            'INTERNAL_ERROR',
            'SKIPPED',
        ]),
    };
}

export const onlySkipped = generateTestRun({
    tests: 3,
    skipped: 3,
    passed: 0,
    failed: 0,
    suites: 3,
    passedSuites: 0,
    failedSuites: 0,
    skippedSuites: 3,
});

export const allPassed = generateTestRun({
    tests: 10,
    skipped: 0,
    passed: 10,
    failed: 0,
    suites: 3,
    passedSuites: 3,
    failedSuites: 0,
    skippedSuites: 0,
});

export const mixed = generateTestRun({});

export const randomTestProjects = (length: number) => {
    const generator = new Chance();
    return Array.from({ length })
        .fill(true)
        .map(() => generator.company());
};

export function generateTestRunForDemo() {
    return generator.n(generateTestRun, 6);
}

export function generateRandomProject(): Project {
    const tests = generator.integer({ min: 3, max: 100 });
    const passed = generator.integer({ min: 0, max: tests });
    const failed = generator.integer({ min: 0, max: tests - passed });

    const skipped = tests - (passed + failed);

    const suites = generator.integer({ min: 1, max: tests });
    const passedSuites = generator.integer({ min: 0, max: suites });
    const failedSuites = generator.integer({
        min: 0,
        max: suites - passedSuites,
    });
    const skippedSuites = suites - (passedSuites + failedSuites);

    return {
        duration: generator.integer({ min: 10, max: 20 }) * 36e3,
        tests,
        passed,
        failed,
        skipped,
        passedSuites,
        failedSuites,
        skippedSuites,
        testID: crypto.randomUUID(),
        suites,
    };
}

export function generateRandomProjects() {
    const projects = generator.n(
        () => generator.company(),
        generator.integer({ min: 2, max: 3 }),
    );
    const projects_json: Projects = {};
    for (const project of projects) {
        projects_json[project] = generator.n(
            generateRandomProject,
            generator.integer({ min: 3, max: 4 }),
        );
    }

    return projects_json;
}

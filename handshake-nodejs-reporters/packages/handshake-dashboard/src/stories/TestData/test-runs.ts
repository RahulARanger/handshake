import dayjs from 'dayjs';
import { Chance } from 'chance';
import type { statusOfEntity } from 'types/session-records';
import type { Project, Projects, TestRunRecord } from 'types/test-run-records';
import { PlatformDetails } from 'components/about-test-entities/platform-entity';

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
    xfailed: number,
    xpassed: number,
): statusOfEntity {
    if (failed) return 'FAILED';
    else if (xpassed) return 'XPASSED';
    else if (passed > 0) return 'PASSED';
    else if (xfailed > 0) return 'XFAILED';
    return 'SKIPPED';
}
const generator = Chance();

export function generateTestRun(rawFeed?: Feeder): TestRunRecord {
    const feed: Feeder = rawFeed ?? {};

    let tests = feed.tests ?? generator.integer({ min: 30, max: 100 });
    let rest = tests;

    const passed = feed.passed ?? generator.integer({ min: 0, max: rest });
    rest -= Math.min(rest, passed);

    const xpassed = feed.xpassed ?? generator.integer({ min: 0, max: rest });
    rest -= Math.min(rest, xpassed);

    const failed = feed.failed ?? generator.integer({ min: 0, max: rest });
    rest -= Math.min(rest, failed);

    const xfailed = feed.xfailed ?? generator.integer({ min: 0, max: rest });
    rest -= Math.min(rest, xfailed);

    const skipped = rest;
    tests = passed + failed + skipped + xpassed + xfailed + skipped;

    const fileRetries =
        feed.fileRetries ?? generator.integer({ min: 0, max: 2 });

    const maxInstances =
        feed.maxInstances ?? generator.integer({ min: 0, max: 2 });

    const bail = generator.integer({ min: 0, max: 3 });

    let suites =
        feed.suites ?? generator.integer({ min: 1, max: Math.min(20, tests) });
    rest = suites;

    const passedSuites =
        feed.passedSuites ?? generator.integer({ min: 0, max: rest });
    rest -= Math.min(rest, passedSuites);

    const failedSuites =
        feed.failedSuites ??
        generator.integer({
            min: 0,
            max: rest,
        });
    rest -= Math.min(rest, failedSuites);

    const xfailedSuites =
        feed.xfailedSuites ??
        generator.integer({
            min: 0,
            max: rest,
        });
    rest -= Math.min(rest, xfailedSuites);

    const xpassedSuites =
        feed.xpassedSuites ??
        generator.integer({
            min: 0,
            max: rest,
        });
    rest -= Math.min(rest, xpassedSuites);

    const skippedSuites = rest;
    suites =
        passedSuites +
        failedSuites +
        skippedSuites +
        xfailedSuites +
        xpassedSuites;

    const platform = generator.pickone([
        'windows',
        'macos',
        'win32',
        'mac13',
        'ubuntu',
    ]);

    const tags = Array.from({ length: generator.integer({ min: 0, max: 4 }) })
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
        standing: getStatus(passed, failed, skipped, xfailed, xpassed),
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
    xpassed: 0,
    suites: 3,
    xpassedSuites: 0,
    passedSuites: 3,
    failedSuites: 0,
    skippedSuites: 0,
});

export const onlyFailed = generateTestRun({
    tests: 3,
    skipped: 0,
    passed: 0,
    failed: 3,
    suites: 3,
    xpassed: 0,
    passedSuites: 0,
    failedSuites: 3,
    xpassedSuites: 0,
    skippedSuites: 0,
});
export const onlyXFailed = generateTestRun({
    tests: 3,
    xfailed: 3,
    suites: 3,
    xfailedSuites: 3,
    skipped: 0,
    passed: 0,
    failed: 0,
    xpassed: 0,
    xpassedSuites: 0,
    failedSuites: 0,
    passedSuites: 0,
});
export const onlyXPassed = generateTestRun({
    tests: 3,
    xpassed: 3,
    suites: 3,
    xpassedSuites: 3,
    passed: 0,
    failed: 0,
    xfailed: 0,
    xfailedSuites: 0,
    failedSuites: 0,
    passedSuites: 0,
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
    const xpassed = generator.integer({ min: 0, max: tests });
    const failed = generator.integer({ min: 0, max: tests - passed });
    const xfailed = generator.integer({ min: 0, max: tests - passed });

    const skipped = tests - (passed + failed);

    const suites = generator.integer({ min: 1, max: tests });
    const passedSuites = generator.integer({ min: 0, max: suites });
    const failedSuites = generator.integer({
        min: 0,
        max: suites - passedSuites,
    });
    const xfailedSuites = generator.integer({
        min: 0,
        max: suites - (passedSuites + failedSuites),
    });
    const xpassedSuites = generator.integer({
        min: 0,
        max: suites - (passedSuites + failedSuites + xfailedSuites),
    });
    const skippedSuites =
        suites - (xfailedSuites + xpassedSuites + passedSuites + failedSuites);

    return {
        duration: generator.integer({ min: 10, max: 20 }) * 36e3,
        tests,
        passed,
        failed,
        skipped,
        xfailed,
        xpassed,
        passedSuites,
        failedSuites,
        skippedSuites,
        xpassedSuites,
        xfailedSuites,
        testID: crypto.randomUUID(),
        suites,
    };
}

function projectFromRun(current: TestRunRecord) {
    return {
        duration: current.duration,
        tests: current.tests,
        passed: current.passed,
        failed: current.failed,
        skipped: current.skipped,
        xfailed: current.xfailed,
        xpassed: current.xpassed,
        passedSuites: current.passedSuites,
        failedSuites: current.failedSuites,
        skippedSuites: current.skippedSuites,
        xpassedSuites: current.xpassedSuites,
        xfailedSuites: current.xfailedSuites,
        testID: current.testID,
        suites: current.suites,
    };
}

export function generateRandomProjects(current?: TestRunRecord) {
    const projects = generator.n(
        () => generator.company(),
        generator.integer({ min: 2, max: 3 }),
    );
    projects[1] = current?.projectName ?? projects[1];

    const projects_json: Projects = {};
    for (const project of projects) {
        projects_json[project] = generator.n(
            generateRandomProject,
            generator.integer({ min: 3, max: 4 }),
        );
    }

    if (current) {
        current.projectIndex = Math.min(
            current.projectIndex,
            projects.length - 1,
        );
        projects_json[current.projectName][
            generator.integer({ min: 1, max: 2 })
        ] = projectFromRun(current);
    }

    return projects_json;
}

export function generateRandomPlatforms(): PlatformDetails {
    return generator.n(
        () => ({
            entityName: generator.pickone([
                'chrome',
                'firefox',
                'safari',
                'edge',
                'chrome-headless-shell',
                'others',
            ]),
            entityVersion: `v${generator.integer({ min: 2, max: 10 })}`,
            simplified: `v${generator.integer({ min: 2, max: 10 })}`,
        }),
        generator.integer({ min: 2, max: 3 }),
    );
}

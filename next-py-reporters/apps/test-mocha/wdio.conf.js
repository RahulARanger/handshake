import { dirname } from 'node:path';

// eslint-disable-next-line import/prefer-default-export
export const config = {
    reporterSyncTimeout: 40e3, // IMPORTANT
    runner: 'local',
    specs: [
        ['./test-mocha/specs/test.e2e.js', './test-mocha/specs/package-version.e2e.js'],
        './test-mocha/specs/test.e2e.js',
        './test-mocha/specs/package-version.e2e.js',
    ],
    services: [
        [
            "Next-Py",
            {
                collectionName: "TestResults",
                projectName: "NeXtReporterMocha",
                port: 6969,
                timeout: 30e3,
                root: dirname(dirname(dirname(process.cwd()))),
            },
        ],
    ],
    reporters: ["spec", ["Next-Py", { port: 6969 }]],
    maxInstances: 10,
    //
    capabilities: [{
        browserName: 'chrome',
        'goog:chromeOptions': {
            args: ['headless', 'disable-gpu'],
        },
    }],
    logLevel: 'info',
    // outputDir: './logs',
    bail: 0,
    baseUrl: 'http://localhost',
    waitforTimeout: 10000,
    connectionRetryTimeout: 120000,
    //
    // Default request retries count
    connectionRetryCount: 3,
    framework: 'mocha',
    mochaOpts: {
        ui: 'bdd',
        timeout: 60000,
    },
}
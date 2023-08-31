import { dirname } from 'node:path';
// eslint-disable-next-line import/extensions
import attachNeXtReporter from './src/glue.js';

// eslint-disable-next-line import/prefer-default-export
export const config = attachNeXtReporter({
    reporterSyncTimeout: 30e3, // IMPORTANT
    runner: 'local',
    specs: [
        ['./test-mocha/specs/test.e2e.js', './test-mocha/specs/package-version.e2e.js'],
        './test-mocha/specs/test.e2e.js',
        './test-mocha/specs/package-version.e2e.js',
    ],
    maxInstances: 1,
    //
    capabilities: [{
        browserName: 'chrome',
        'goog:chromeOptions': {
            args: ['headless', 'disable-gpu'],
        },
    }],
    logLevel: 'info',
    outputDir: './logs',
    bail: 0,
    baseUrl: 'http://localhost',
    waitforTimeout: 10000,
    connectionRetryTimeout: 120000,
    //
    // Default request retries count
    connectionRetryCount: 3,
    services: [
        'chromedriver',
    ],
    framework: 'mocha',
    reporters: ['spec'],
    mochaOpts: {
        ui: 'bdd',
        timeout: 60000,
    },
}, {
    collectionName: 'TestResults',
    reportLabel: 'mocha',
    port: 6969,
    root: dirname(process.cwd()),
    projectName: 'NeXtReport:Mocha',
});

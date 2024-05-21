import { join, dirname } from 'node:path';
import { attachReporter } from "wdio-handshake-reporter"

// eslint-disable-next-line import/prefer-default-export
const metaConfig = {
    reporterSyncTimeout: 40e3, // IMPORTANT
    runner: 'local',
    specs: [
        './test-mocha/specs/test.e2e.js',
        './test-mocha/specs/package-version.e2e.js',
    ],
    maxInstances: 10,
    specFileRetries: 1,
    //
    capabilities: [{
        browserName: 'chrome',
        'goog:chromeOptions': {
            args: ['headless', 'disable-gpu']
        }
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
        grep: "(version|login)",
        invert: Boolean(process.env.SANITY)
    },
    beforeTest: async function () {
        await browser.takeScreenshot();
    },
    afterTest: async function () {
        await browser.takeScreenshot();
    }
}

export const config = attachReporter(metaConfig, {
    resultsFolderName: process.env.LOCAL ? '../../../TestResults' : "TestResults",
    port: 6966,
    requestsTimeout: 360e3,
    addScreenshots: true,
    testConfig: { projectName: process.env.SANITY ? 'sanity-test-wdio-mocha' : 'test-wdio-mocha' },
    logLevel: "error",
    exportOutDir: "TestReports"
});

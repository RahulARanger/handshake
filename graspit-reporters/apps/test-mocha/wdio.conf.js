import { dirname, join } from 'node:path';
import { attachReporter } from "wdio-graspit-reporter"

// eslint-disable-next-line import/prefer-default-export
const metaConfig = {
    reporterSyncTimeout: 40e3, // IMPORTANT
    runner: 'local',
    specs: [
        './test-mocha/specs/test.e2e.js',
        // './test-mocha/specs/package-version.e2e.js',
    ],
    maxInstances: 10,
    specFileRetries: 0,
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
    beforeTest: async function () {
        await browser.takeScreenshot();
    },
    afterTest: async function () {
        await browser.takeScreenshot();
    }
}

const root = dirname(dirname(dirname(process.cwd())))
export const config = attachReporter(metaConfig, {
    collectionName: "TestResults",
    projectName: "NeXtReporter:Mocha",
    port: 6969,
    timeout: 30e3,
    root,
    exePath: join(root, "dist", "graspit"),
    addScreenshots: true
});

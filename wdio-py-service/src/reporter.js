/* eslint-disable import/no-unresolved */
import { relative } from 'node:path';
import WDIOReporter from '@wdio/reporter';
import logger from '@wdio/logger';
import AsyncLock from 'async-lock';
import fetch from 'node-fetch';

/**
 *
 * @param {Date | undefined} endDate end date of the test entity
 * @param {string[] | undefined} failures list of failures if there else undefined
 * @returns {string} returns the status of the test on "before" hook
 */
function returnStatus(endDate, failures) {
    if (!endDate) return 'PENDING';
    return failures?.length ? 'FAILED' : 'PASSED';
}

export default class NeXtReporter extends WDIOReporter {
    logger = logger('wdio-py-reporter');

    lock = new AsyncLock({ timeout: 60e3, maxExecutionTime: 60e3, maxPending: 1000 });

    packing = false; // false if its free

    port = 6969;

    get url() {
        return `http://127.0.0.1:${this.port}`;
    }

    get saveUrl() {
        return `${this.url}/save`;
    }

    get addFeatureUrl() {
        return `${this.saveUrl}/addFeature`;
    }

    get addSuiteUrl() {
        return `${this.saveUrl}/addSuite`;
    }

    get registerSession() {
        return `${this.saveUrl}/registerSession`;
    }

    get registerSuite() {
        return `${this.saveUrl}/registerSuite`;
    }

    get updateSuite() {
        return `${this.saveUrl}/updateSuite`;
    }

    get updateSession() {
        return `${this.saveUrl}/updateSession`;
    }

    get getService() {
        return `${this.url}/get`;
    }

    /**
     *
     * @param {{port?: number, timeout?: number}} options Options for the reporter
     */
    constructor(options) {
        super(options);
        this.port = options.port ?? this.port;
    }

    /**
     *
     * @param {string} feedURL url to use for sending the request to
     * @param {any} feedJSON request body
     */
    feed(feedURL, feedJSON) {
        this.lock.acquire(
            this.runnerStat.config.framework,
            async (done) => {
                this.logger.info(`Requesting ${feedURL} `);
                const resp = await fetch(feedURL, { method: 'PUT', body: JSON.stringify(feedJSON), keepalive: true });
                done(Math.floor(resp.status / 200) === 1
                    ? undefined : resp.statusText, await resp.text());
            },
            (er, text) => {
                if (er) this.logger.error(er);
                else this.logger.info(text);
            },
        );
    }

    /**
     * @typedef {import("@wdio/reporter").RunnerStats} RunnerStats
     * @param {RunnerStats} stats Stats when starting the Runner
     */
    onRunnerStart(stats) {
        /**
         * @type {number}
         */

        const [startDate, endDate] = [stats.start.toUTCString(), stats.end?.toUTCString()];
        const standing = returnStatus(stats.end, stats.failures);
        const {
            failures, duration,
        } = stats;
        const totalRetries = stats.retries;
        const retried = stats.retry;
        const [browserName, browserVersion, platformName] = stats.sanitizedCapabilities.split('.');

        const { framework, logLevel, automationProtocol } = this.runnerStat.config;
        const { specs } = this;
        const suitesConfig = this.runnerStat.config.suites;

        const payload = {
            duration,
            startDate,
            endDate,
            standing,
            browserName,
            failures: failures ?? 0,
            retried,
            totalRetries,
            platformName,
            browserVersion,
            sessionID: this.runnerStat.sessionId,
            framework,
            logLevel,
            specs: (specs ?? []).map((spec) => relative(process.cwd(), spec)),
            suitesConfig,
            automationProtocol,
        };

        this.feed(this.registerSession, payload);
    }

    /**
     * @typedef {import("@wdio/reporter").SuiteStats} SuiteStats
     * @typedef {import("@wdio/reporter").TestStats} TestStats
     * @param {SuiteStats | TestStats} suiteOrTest Can either be a suite or a test
     * @returns {{description, title, parent, fullTitle,
     *  file, tags, standing, startDate, endDate, session_id, totalRetries, retried}}
     * returns the info that is crucial to the suite or test
     */
    extractSuiteOrTestDetails(suiteOrTest) {
        const {
            duration, title, fullTitle, file, tags,
            // , description,
            //  rule,
            // above commented keys are for the Gherkin Files
        } = suiteOrTest;
        const startDate = suiteOrTest.start.toUTCString();
        const endDate = suiteOrTest.end?.toUTCString();
        const parent = suiteOrTest?.parent ? `${this.currentSuites.at(-1).start.toUTCString()}-${this.currentSuites.at(-1).uid}` : '';
        const payload = {
            duration,
            title,
            parent,
            suiteID: `${startDate}-${suiteOrTest.uid}`,
            fullTitle,
            file: relative(process.cwd(), file ?? this.currentSuites.at(-1).file),
            standing: returnStatus(suiteOrTest.end, this.runnerStat.failures),
            tags: tags ?? [],
            startDate,
            endDate,
            session_id: this.runnerStat.sessionId,
            totalRetries: this.runnerStat.retries,
            retried: this.runnerStat.retry,
        };
        return payload;
    }

    /**
     * @param {SuiteStats | TestStats} suiteOrTest Can either be a suite or a test
     * @returns {{duration, startDate, endDate, failures, sessionID, standing}}
     * returns the info that needs to be updated for either suite or test
     */
    extractRequiredForCompletion(suiteOrTest) {
        const {
            duration,
        } = suiteOrTest;

        const startDate = suiteOrTest.start.toUTCString();
        const endDate = suiteOrTest?.end ? suiteOrTest.end.toUTCString() : '';
        const standing = (suiteOrTest.uid.includes('test') ? (suiteOrTest?.state || 'PENDING') : '').toUpperCase();

        const payload = {
            duration,
            startDate,
            suiteID: `${startDate}-${suiteOrTest.uid}`,
            endDate,
            failures: this.runnerStat.failures ?? 0,
            sessionID: this.runnerStat.sessionId,
            standing,
        };

        return payload;
    }

    /**
     *
     * @param {SuiteStats} suite stats provided for a suite
     */
    onSuiteStart(suite) {
        const payload = this.extractSuiteOrTestDetails(suite);
        payload.suiteType = 'SUITE';
        this.feed(this.registerSuite, payload);
    }

    /**
     *
     * @param {SuiteStats} suite stats provided for a suite
     */
    onSuiteEnd(suite) {
        const payload = this.extractRequiredForCompletion(suite);
        payload.suiteType = 'SUITE';

        this.feed(this.updateSuite, payload);
    }

    /**
     *
     * @param {TestStats} test
     * meta data related to the test case that will be now executed
     */
    addTest(test) {
        const payload = this.extractSuiteOrTestDetails(test);
        payload.suiteType = 'TEST';
        this.feed(this.registerSuite, payload);
    }

    /**
     *
     * @param {TestStats} test
     * meta data related to the test case that will be now executed
     */
    onTestStart(test) {
        this.addTest(test);
    }

    /**
     *
     * @param {TestStats} test
     * meta data related to the test case that will be now executed
     */
    markTestCompletion(test) {
        const payload = this.extractRequiredForCompletion(test);
        payload.suiteType = 'TEST';

        this.feed(this.updateSuite, payload);
    }

    /**
     *
     * @param {TestStats} test
     * meta data related to the test case that will be now executed
     */
    onTestEnd(test) {
        this.markTestCompletion(test);
    }

    onTestSkip(test) {
        // skipped tests are not registered
        // this.packing = true;
        this.addTest(test);
        this.markTestCompletion(test);
        // this.packing = false;
    }

    /**
     *
     * @param {RunnerStats} runner
     * info regarding the session, it is required for updating the registered session
     */
    onRunnerEnd(runner) {
        const endDate = runner.end?.toUTCString();
        const {
            passes: passed, skipping: skipped, tests,
        } = this.counts;
        const failed = this.counts.failures ?? 0;
        const retried = runner.retries;
        const standing = returnStatus(runner.end, runner.failures);

        const payload = {
            duration: this.runnerStat.duration,
            passed,
            failed,
            skipped,
            endDate,
            tests,
            retried,
            standing,
            sessionID: this.runnerStat.sessionId,
        };

        this.feed(this.updateSession, payload);
    }

    /**
     * Return true if we have completed blocking operation
     * saves us from race condition
     * @returns {boolean} Return true if we have completed sending data
     */
    get isSynchronised() {
        return !this.lock.isBusy();
    }
}
